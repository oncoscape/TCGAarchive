# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)
library(jsonlite)
library(mongolite)

date <- as.character(Sys.Date())
chromosomes <- c(seq(1:22), "X", "Y")

db <- "test"
host="mongodb://localhost"

dataset_map <- list(
  brca=list(name="Breast", img= "DSbreast.png", beta=FALSE, source="TCGA"),
  brain=list(name="Brain", img= "DSbrain.png", beta=FALSE, source="TCGA"),
  gbm=list(name="Glioblastoma", img= "DSbrain.png", beta=TRUE, source="TCGA"),
  coadread=list(name="Colorectal", img= "DScoadread.png", beta=TRUE, source="TCGA"),
  hnsc=list(name="Head and Neck", img= "DShnsc.png", beta=TRUE, source="TCGA"),
  lgg=list(name="Lower grade glioma", img= "DSbrain.png", beta=TRUE, source="TCGA"),
  luad=list(name="Lung adenocarcinoma", img= "DSlung.png", beta=TRUE, source="TCGA"),
  lusc=list(name="Lung squamous cell", img= "DSlung.png", beta=TRUE, source="TCGA"),
  lung=list(name="Lung", img= "DSlung.png", beta=TRUE, source="TCGA"),
  prad=list(name="Prostate", img= "DSprostate.png", beta=TRUE, source="TCGA"),
  paad=list(name="Pancreas", img= "DSpancreas.png", beta=TRUE, source="TCGA"),
  acc=list(name="Adrenocortical carcinoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  blca=list(name="Bladder urothelial carcinoma", img= "DSbladder.png", beta=TRUE, source="TCGA"),
  cesc=list(name="Cervical", img= "DSovary.png", beta=TRUE, source="TCGA"),
  chol=list(name="Cholangiocarcinoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  dlbc=list(name="Diffuse large B-cell", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  esca=list(name="Esophageal", img= "DShnsc.png", beta=TRUE, source="TCGA"),
  laml=list(name="Acute Myeloid Leukemia", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  sarc=list(name="Sarcoma", img= "DSsarcoma.png", beta=TRUE, source="TCGA"),
  stad=list(name="Stomach", img= "DSdemo.png", beta=TRUE, source="TCGA")
)



#---------------------------------------------------------
## mongolite requires all insertions to be of type data.frame
connect.to.mongo <- function(){
#  mongo <- mongo(collection=collection, db=db, url=host)
  
  mongo.manifest <<- mongo(collection="manifest",db=db, url=host)
  mongo.lookup <<- mongo(collection="lookup_oncoscape_datasources",db=db, url=host)
  
}
#---------------------------------------------------------
## mongolite requires all insertions to be of type data.frame
close.mongo <- function(){

	rm(mongo.manifest)
	rm(mongo.lookup)
}
#---------------------------------------------------------
### For any mutation file, create and save an indicator mut01 file
save.mut01.from.mut <- function(oCollection, result){
  mut.list <- result
  
  data.list <- lapply(result, function(geneSet){
    patients <- lapply(geneSet$patients, function(pt){mut <- nchar(pt); mut01 <- ifelse(mut > 0, 1, 0 ); mut01 })
    list(gene=geneSet$gene,min=min(unlist(patients)), max=max(unlist(patients)), patients = patients)
  })    
  
  insert.document(oCollection, result = data.list)
}
#---------------------------------------------------------
collection.exists <- function( collection.name){

  con <- mongo(collection.name, db=db, url=host)
  count <- con$count()
  rm(con)
  
  if(count != 0){
    print(paste(collection.name, " already exists.", sep=""))
    return(TRUE)
  }  
  return(FALSE)

}
#---------------------------------------------------------
create.oCollection <- function(dataset, dataType,source, processName, parent, process){
  
  newCollection <- list(dataset=dataset, dataType=dataType, date=date) 
  newCollection$source <- source
  newCollection$process <- process
  newCollection$processName <- processName
  newCollection$parent <- parent

  newCollection$collection <- collection.create.name(newCollection)
  
  return(newCollection)
}
#---------------------------------------------------------
collection.create.name <- function( oCollection){
  
  source <- unique(oCollection$source)
  if(length(source)>1) source <- list(source)
  sourceName <- paste(unlist(source), collapse="-")
  
  collection.uniqueName <- paste(oCollection$dataset, oCollection$dataType, sourceName, oCollection$processName, sep="_")
  collection.uniqueName <- gsub("\\s+", "", tolower(collection.uniqueName))
  
  return(collection.uniqueName)
}
#---------------------------------------------------------
insert.prep <- function(oCollection){
  #dataset, dataType,source, processName, parent, process
  
  prev.run <- collection.exists(oCollection$collection)
  if(prev.run){ return(FALSE) }
  
   ## add document to manifest collection
    mongo.manifest$insert( toJSON(oCollection, auto_unbox = T))

   #add record to lookup
    insert.lookup(oCollection)
    
  return(TRUE)
}

#---------------------------------------------------------
insert.lookup.sourceTypeCollection <- function(oCollection, data.list){
  add.collection <- list(data.frame(source=oCollection$source, type=oCollection$dataType, collection=oCollection$collection))
  if(lookupType %in% names(data.list)){
    data.list$molecular <- c(data.list[[lookupType]], add.collection)
  }else{data.list[[lookupType]] <- add.collection}
  
  return(data.list)
} 
#---------------------------------------------------------
insert.lookup.clinical <- function(oCollection, data.list){
  add.collection <- list()
  add.collection[dataType] <- oCollection$collection
  if("clinical" %in% names(data.list)){
    data.list$clinical	<- c(data.list$clinical, add.collection)
  } else {data.list$clinical <- add.collection }

  return(data.list)
}
#---------------------------------------------------------
insert.lookup.network <- function(oCollection, data.list){
  ptweights   <- gsub("\\s+", "", tolower(paste(oCollection$dataset, "ptDegree", oCollection$source, oCollection$processName, sep="_")))
  geneweights <- gsub("\\s+", "", tolower(paste(oCollection$dataset, "geneDegree", oCollection$source, oCollection$processName, sep="_")))
  add.collection <- list(data.frame(name=oCollection$process$geneset,source=oCollection$source, edges=oCollection$collection, 
                                    patientWeights=ptweights, 
                                    genesWeights=geneweights))
  if("edges" %in% names(data.list)){
    data.list$edges	<- c(data.list$edges, add.collection)
  } else {data.list$edges <- add.collection }
  
  return(data.list)
}
#---------------------------------------------------------
insert.lookup <- function(oCollection){
  
  ## add record to lookup collection
  query <- toJSON(list("disease"=oCollection$dataset), auto_unbox = T)
  oLookup <- mongo.lookup$find(query)
  
  if(length(oLookup)==0){
    oLookup <- list(disease = dataset, source = dataset_map[[dataset]]$source,beta = dataset_map[[dataset]]$beta)
    oLookup$name = dataset_map[[dataset]]$name
    oLookup$img = dataset_map[[dataset]]$img
  }
  
  dataType = oCollection$dataType
  if(dataType %in% names(lookupList)){
    oLookup = do.call(lookupList[[dataType]][["insert.lookup"]],list(oCollection, oLookup))
  
    ## insert lookup into mongo collection
    mongo.lookup$update(query, toJSON(oLookup, auto_unbox = T), upsert=T)
  
  }else{
    if(dataType %in% c("ptDegree", "geneDegree")){
      print(paste(dataType, "lookup info processed with edge creation", sep=" "))
    }else{
      print(paste("WARNING: data type not recognized:", dataType, sep=" "))
    }
  }
}
#---------------------------------------------------------
insert.document.molecular = function(result){
  insert.pass <- sapply(rownames(result), function(geneName){
    status = con$insert(
      toJSON( list(gene=geneName, min=min(result[geneName,]), max=max(result[geneName,]), patients = as.list(result[geneName,])) 
              , auto_unbox=T)); 
    status$nInserted;
  })
  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}
#---------------------------------------------------------
insert.document.facs = function(result){
  insert.pass <- sapply(colnames(result), function(ptName){
    status = con$insert(
      toJSON( list(patient=ptName, markers = result[,ptName])
              , auto_unbox=T)); 
    status$nInserted;
  })
  
  return (c(n.pass= sum(unlist(insert.pass)), n.records = ncol(result) ) )
}
#---------------------------------------------------------
insert.document.annotation = function(result){
  insert.pass <- sapply(rownames(result), function(idName){
    status = con$insert(
      toJSON( list(id=idName, data = as.list(result[idName,]))
              , auto_unbox=T)); 
    status$nInserted;
  })

  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}
#---------------------------------------------------------
insert.document.row = function(result){
  insert.pass <- sapply(rownames(result), function(idName){
    status = con$insert(
      toJSON( result[idName,]
              , auto_unbox=T)); 
    status$nInserted;
  })

  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}
#---------------------------------------------------------
insert.document.geneset = function(result){
  insert.pass <- apply(result,1, function(row){
    status = con$insert(
      toJSON( list(name=row[["name"]],genes=row[["genes"]])
              , auto_unbox=T)); 
    status$nInserted;
  })

  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}

#---------------------------------------------------------
insert.collection <- function(oCollection, result, insert.function, ...){
  
  ## insert new collection data
      con <- mongo(oCollection$collection, db=db, url=host)

      doc.pass <- insert.prep(oCollection)
      if(!doc.pass){print("Skipping."); return()}
      
      if(oCollection$dataType %in% names(lookupList))
        insert.status = do.call(lookupList[[oCollection$dataType]][["insert.document"]], list(result))
      else{
        print(paste("WARNING: data type not recognized for insert.collection:", dataType))
        insert.pass =0; 
        if(is.list(result)) numRecords=length(result)
        else numRecords = nrow(result)
      }
      
      rm(con)
      if(insert.status$n.pass != insert.status$n.records){  
        print(paste("ERROR: not all documents properly inserted in ", oCollection$collection, insert.status$n.pass, "of",insert.status$n.records))
        remove.collection(oCollection);
      }
      ### --- FINISH insert into Mongo    
      
  if(oCollection$dataType == "mut"){
    newID <-  mongo.manifest$find(query=toJSON(oCollection, auto_unbox = T), fields='{"_id":1}')
    new.oCollection <- oCollection
    new.oCollection$dataType = "mut01"
    new.oCollection$parent = newID
    save.mut01.from.mut(new.oCollection, result)
  }
  
}
#---------------------------------------------------------
remove.collection <- function(oCollection){
  
  con <- mongo(oCollection$collection, db=db, url=host)
  con$drop()
  
  mongo.manifest$remove(paste("{'collection':",oCollection$collection, "}"))
  remove.lookup(oCollection)
  
  print(paste(oCollection$collection, "removed."))
}
#---------------------------------------------------------
remove.lookup <- function(oCollection){
  query <- toJSON(list("disease"=oCollection$dataset), auto_unbox = T)
  lookup.doc = mongo.lookup$find(query)
  
  lookupType = lookupList[[oCollection$dataType]][["type"]]
  
  collections <- lookup.doc[[lookupType]]
  
  if(lookupType %in% c("molecular", "calculated", "location", "annotation", "category")){
    matched.record = which(sapply(collections, function(el){el$collection == oCollection$collection}))
    collections[[matched.record]]$collection = NULL 
    lookup.doc[[lookupType]] = collections
  }
  ### TO DO:
  # else if(dataType %in% c("edges")){
  #}else if(dataType %in% c("patient", "drug", "radiation", "followUp-v1p0","followUp-v1p5","followUp-v2p0", "followUp-v2p1", "followUp-v4p0","followUp-v4p4","followUp-v4p8", "newTumor", "newTumor-followUp-v1p0", "newTumor-followUp-v4p0","newTumor-followUp-v4p4","newTumor-followUp-v4p8", "otherMalignancy-v4p0", "events")){
  #}else if{}
  
  mongo.lookup$update(query, update=lookup.doc)
}

#---------------------------------------------------------
insert.collection.separate<- function(name, indiv.collection){

  name <- tolower(name)
  con <- mongo(name, db=db, url=host)
  
  if(con$count() != 0){
    print(paste(name, " already exists. Skipping.", sep=""))
	rm(con)
    return()
  }  
  
  ## add collection to database
  lapply(indiv.collection, function(item){
    con$insert(item)
  })
  rm(con)
 
}

#---------------------------------------------------------
save.collection<- function(dataset, dataType,source,result, parent, process,processName){
  
  cat("-save collection\n")
  
  collection.uniqueName <-  collection.create.name(dataset, dataType,source, processName)
  prev.run <- collection.exists(collection.uniqueName)
  if(prev.run){ print("Skipping."); return(NA) }
  
  newCollection <- list(dataset=dataset, dataType=dataType, date=date) 
  newCollection$collection <- collection.uniqueName
  newCollection$source <- source
  newCollection$process <- process
  newCollection$parent <- parent
  
  ## add record to manifest collection
  mongo.manifest$insert( toJSON(newCollection, auto_unbox = T))
  
  ## insert new collection data
  con <- mongo(collection.uniqueName, db=db, url=host)
  pass <- lapply(result, function(el){ status = con$insert(toJSON(el, auto_unbox=T)); status$nInserted;})
  if(sum(unlist(pass)) != length(result)){
    print(paste("ERROR: result not inserted into mongodb: ", collection.uniqueName, sep=""))
	rm(con)
    return()
  }
  
  
  ## add record to lookup collection
  query <- toJSON(list("disease"=dataset), auto_unbox = T)
  datasource <- mongo.lookup$find(query)
  
  if(length(datasource)==0){
    data.list <- list(disease = dataset, source = dataset_map[[dataset]]$source,beta = dataset_map[[dataset]]$beta)
    data.list$name = dataset_map[[dataset]]$name
    data.list$img = dataset_map[[dataset]]$img
  }else{
    data.list <- datasource
  }
  
  if(dataType %in% c("cnv","mut01", "mut", "rna", "protein", "methylation", "facs", "psi")){
    # update molecular
    
    add.collection <- list(data.frame(source=source, type=dataType, collection=collection.uniqueName))
    if("molecular" %in% names(data.list)){
      data.list$molecular <- c(data.list$molecular, add.collection)
    }else{data.list$molecular <- add.collection}
    
  }else if(dataType %in% c("mds", "pcaScores")){
    #update calculated
    add.collection <- list(data.frame(source=source, type=dataType, collection=collection.uniqueName))
    if("calculated" %in% names(data.list)){
      data.list$calculated	<-c(data.list$calculated, add.collection)
    } else {data.list$calculated <- add.collection }
    
  }else if(dataType %in% c("edges")){
    #update edges
    ptweights   <- gsub("\\s+", "", tolower(paste(dataset, "ptDegree", source, processName, sep="_")))
    geneweights <- gsub("\\s+", "", tolower(paste(dataset, "geneDegree", source, processName, sep="_")))
    add.collection <- list(data.frame(name=process$geneset,source=source, edges=collection.uniqueName, 
                           patientWeights=ptweights, 
                           genesWeights=geneweights))
    if("edges" %in% names(data.list)){
      data.list$edges	<- c(data.list$edges, add.collection)
    } else {data.list$edges <- add.collection }
    
  }else if(dataType %in% c("ptDegree", "geneDegree")){
    print(paste(dataType, "lookup info processed with edge creation", sep=" "))
    return()
  }else if(dataType %in% c("patient", "drug", "radiation", "followUp-v1p0","followUp-v1p5","followUp-v2p0", "followUp-v2p1", "followUp-v4p0","followUp-v4p4","followUp-v4p8", "newTumor", "newTumor-followUp-v1p0", "newTumor-followUp-v4p0","newTumor-followUp-v4p4","newTumor-followUp-v4p8", "otherMalignancy-v4p0", "events")){
    #update patient
    add.collection <- list()
    add.collection[dataType] <- collection.uniqueName
    if("clinical" %in% names(data.list)){
      data.list$clinical	<- c(data.list$clinical, add.collection)
    } else {data.list$clinical <- add.collection }
    
  }else if(dataType %in% c("chromosome", "centromere", "genes")){
    #update patient
    add.collection <- list(data.frame(source=source, type=dataType, collection=collection.uniqueName))
    if("location" %in% names(data.list)){
      data.list$location	<- c(data.list$location, add.collection)
    } else {data.list$location <- add.collection }
    
  }else if(dataType %in% c("annotation")){
    #update patient
    add.collection <- list(data.frame(source=source, type=dataType, collection=collection.uniqueName))
    if("annotation" %in% names(data.list)){
      data.list$annotation	<- c(data.list$annotation, add.collection)
    } else {data.list$annotation <- add.collection }
    
  }else if(dataType %in% c("genesets", "color")){
    add.collection <- list(data.frame(source=source, type=dataType, collection=collection.uniqueName))
    if("category" %in% names(data.list)){
      data.list$category <- c(data.list$category, add.collection)
    }else{data.list$category <- add.collection}
    
  }else{
    print(paste("WARNING: data type not recognized:", dataType, sep=" "))
    return()
  }
  
  ## insert lookup into mongo collection
  mongo.lookup$update(query, toJSON(data.list, auto_unbox = T), upsert=T)
  
  if(dataType == "mut"){
    newID <-  mongo.manifest$find(query=toJSON(newCollection, auto_unbox = T), fields='{"_id":1}')
    save.mut01.from.mut(dataset, dataType="mut01",source,result=result, parent=newID, process, processName)
  }
}

#---------------------------------------------------------
convert.to.mtx <- function(data.list, format=""){
  mtx <- sapply(data.list, function(geneRow){ 
    val <-geneRow$patients; 
    null.val <- which(unlist(lapply(val, is.null)))
    if(length(null.val)>0) val[null.val] <- NA
    val <- unlist(val);
    if(format == "as.numeric") val <- as.numeric(val)
    val})
  colnames(mtx) <- sapply(data.list, function(geneRow){ geneRow$gene})
  rownames(mtx) <- names(data.list[[1]]$patients)
  return(mtx)  
}

#---------------------------------------------------------
mapProcess <- function(process){
  os.dataset.enumerations     <- fromJSON("../manifests/os.dataset.enumerations.json" )
	processFound <-	sapply(os.dataset.enumerations$dataType, function(typeMap){ process %in% unlist(typeMap) })
	numMatches <- length(which(processFound))
	if(numMatches==1)
		return (names(os.dataset.enumerations$dataType)[which(processFound)])

	stop(printf("mapProcess found %d matches for process %s", numMatches, process))
	return(NA)
}
#---------------------------------------------------------
# Aggregate unmapped column names and classes into a single list  
appendList <- function (x, val) 
{
    if(!is.list(x) && !is.list(val)) return(x)
    xnames <- names(x)
    for (v in names(val)) {
        x[[v]] <- if (v %in% xnames && is.list(x[[v]]) && is.list(val[[v]])) 
            appendList(x[[v]], val[[v]])
        else unique(c(x[[v]], val[[v]]))
    }
    x
}


#--------------------------------------------------------------#
get.chromosome.dimensions <- function(scaleFactor=100000){
  
  chrPosScaledObj <- mongo.find.all(mongo, paste(db, "manifest", sep="."), list(dataset="hg19",dataType="chromosome", process=list(scale=scaleFactor)))[[1]]
  
  chrCoord <- mongo.find.all(mongo, paste(db,chrPosScaledObj$collection, sep="."))[[1]][["data"]]
  chrPos_xy <-t(sapply(chromosomes, function(chr){ return(c(chrCoord[[chr]]$x, chrCoord[[chr]]$q))}))
  chrDim <- c(max(chrPos_xy[,1]), max(chrPos_xy[,2]))
  
  return(chrDim)
}
#--------------------------------------------------------------#
scaleSamplesToChromosomes <- function(mtx, chrDim, dim.names=c("x", "y", "z")){
  
  mtx <- apply(mtx, 2, function(col){ -1* min(col) + col})
  # offset mtx so min val is 0,0
  mtx.max <- apply(mtx, 2, max)
  
  r2Chr <- sum(chrDim*chrDim)
  r2Mtx <- sum(mtx.max*mtx.max)	
  scale <- sqrt(r2Chr/r2Mtx)
  # make diagonal of drawing regions equal
  
  mtx <- mtx * scale
  mtx <- round(mtx)
  
  list.coord <- lapply(rownames(mtx), function(name){
    vals <- data.frame(t(mtx[name,dim.names]))
  })
  names(list.coord) <- rownames(mtx)
  return(list.coord)
}
#--------------------------------------------------------------#
scaleGenesToChromosomes <- function(genePos, chrCoordinates, scaleFactor=1000){
  
  genePos_xy <- lapply(genePos, function(gene){
    x <- chrCoordinates[gene[1], "xOffset"]
    y <- chrCoordinates[gene[1], "yOffset"] + as.numeric(gene[2])/scaleFactor
    data.frame(x=round(x),y=round(y))
  })
  
  return(genePos_xy)	
  
}

#--------------------------------------------------------------#
save.batch.genesets.scaled.pos <- function(scaleFactor=100000){
  
  geneObj<- mongo.find.all(mongo, paste(db,"manifest", sep="."), list(dataset="hg19", dataType="genes", process=list(scale=scaleFactor)))[[1]]
  genePos_scaled <- mongo.find.all(mongo, paste(db,geneObj$collection, sep="."))[[1]]
  
  genesetObj <-  mongo.find.all(mongo, paste(db,"manifest", sep="."), list(dataset="hg19",dataType="genesets"))[[1]]
  genesets <- mongo.find.all(mongo, paste(db,genesetObj$collection, sep="."))
  
  process <- list(scale=scaleFactor); 
  processName <- paste(process, collapse="-")
  parent <- list(geneObj$`_id`,genesetObj$`_id`)
  
  result <- lapply(genesets, function(geneSet){	
    genes <- geneSet$genes
    map_genes <- intersect(genes, names(genePos_scaled$data))
    genesetPos <- genePos_scaled$data[map_genes]
    list(type="geneset", name=geneSet$name, scale=scaleFactor, data=genesetPos)
  }	)
  
  save.collection(mongo,db, dataset=geneObj$dataset, dataType="genesets",source=geneObj$source, result=result,
                  parent=parent, process=process,processName=processName)
}

#--------------------------------------------------------------#
save.batch.cluster.scaled.pos <- function(scaleFactor=100000){
  
  mds_colls<- mongo.find.all(mongo, paste(db,"manifest",sep="."), list(dataType="mds", scale=NA))
  chrDim <- get.chromosome.dimensions(scaleFactor) 
  
  for(collection in mds_colls)
    coll <- mongo.find.all(mongo, paste(db,collection$collection, sep="."))[[1]]
    mtx <- convert.to.mtx(coll, format="as.numeric");
    mds.list <- scaleSamplesToChromosomes(mtx, chrDim, dim.names=c("x", "y"))
    result <- list(type="cluster", dataset=collection$dataset, name=outputName, scale=scaleFactor, data=mds.list)
    save.collection(mongo,db, dataset=collection$dataset, dataType=collection$dataType,source=collection$source, result=list(result),
                  parent=collection$parent, process=list(scale=scaleFactor),processName=collection$processName)
}


lookupList = list(
  cnv=list(type="molecular",
           data.load = "os.data.load.molecular",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.molecular" ),
  mut=list(type="molecular",
           data.load = "os.data.load.molecular",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.molecular" ),
  mut01=list(type="molecular",
             data.load = "os.data.load.molecular",
             insert.lookup = "insert.lookup.sourceTypeCollection",
             insert.document = "insert.document.molecular" ),
  rna=list(type="molecular",
           data.load = "os.data.load.molecular",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.molecular" ),
  protein=list(type="molecular",
               data.load = "os.data.load.molecular",
               insert.lookup = "insert.lookup.sourceTypeCollection",
               insert.document = "insert.document.molecular" ),
  methylation=list(type="molecular",
                   data.load = "os.data.load.molecular",
                   insert.lookup = "insert.lookup.sourceTypeCollection",
                   insert.document = "insert.document.molecular" ),
  psi=list(type="molecular",
           data.load = "os.data.load.molecular",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.molecular" ),
  fac=list(type="molecular",
           data.load = "os.data.load.molecular",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.facs" ),
  mds=list(type="calculated",
           data.load = "os.data.load.XXX",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.ptSimilarity" ),
  pcaScores=list(type="calculated",
                 data.load = "os.data.load.XXX",
                 insert.lookup = "insert.lookup.sourceTypeCollection",
                 insert.document = "insert.document.ptSimilarity" ),
  chromosome=list(type="location",
                  data.load = "os.data.load.XXX",
                  insert.lookup = "insert.lookup.sourceTypeCollection",
                  insert.document = "insert.document.location" ),
  centromere=list(type="location",
                  data.load = "os.data.load.XXX",
                  insert.lookup = "insert.lookup.sourceTypeCollection",
                  insert.document = "insert.document.location" ),
  genes=list(type="location",
             data.load = "os.data.load.XXX",
             insert.lookup = "insert.lookup.sourceTypeCollection",
             insert.document = "insert.document.location" ),
  annotation=list(type="annotation",
                  data.load = "os.data.load.annotation",
                  insert.lookup = "insert.lookup.sourceTypeCollection",
                  insert.document = "insert.document.row" ),
  genesets=list(type="category",
                data.load = "os.data.load.genome",
                insert.lookup = "insert.lookup.sourceTypeCollection",
                insert.document = "insert.document.genesets" ),
  color=list(type="category",
             data.load = "os.data.load.categories",
             insert.lookup = "insert.lookup.sourceTypeCollection",
             insert.document = "insert.document.category" ),
  edges=list(type="edges",
             data.load = "os.data.load.XXX",
             insert.lookup = "insert.lookup.network",
             insert.document = "insert.document.category" ),
  events=list(type="clinical",
              data.load = "os.data.load.clinical.events",
              insert.lookup = "insert.lookup.clinical",
              insert.document = "insert.document.row" ),
  
  patient=list(type="clinical",
               data.load = "os.data.load.clinical",
               insert.lookup = "insert.lookup.clinical",
               insert.document = "insert.document.row" ),
  drug=list(type="clinical",
            data.load = "os.data.load.clinical",
            insert.lookup = "insert.lookup.clinical",
            insert.document = "insert.document.row" ),
  radiation=list(type="clinical",
                 data.load = "os.data.load.clinical",
                 insert.lookup = "insert.lookup.clinical",
                 insert.document = "insert.document.row" ),
  followUp=list(type="clinical",
                data.load = "os.data.load.clinical",
                insert.lookup = "insert.lookup.clinical",
                insert.document = "insert.document.row" ),
  newTumor=list(type="clinical",
                data.load = "os.data.load.clinical",
                insert.lookup = "insert.lookup.clinical",
                insert.document = "insert.document.row" ),
  `newTumor-followUp`=list(type="clinical",
                           data.load = "os.data.load.clinical",
                           insert.lookup = "insert.lookup.clinical",
                           insert.document = "insert.document.row" ),
  otherMalignancy=list(type="clinical",
                       data.load = "os.data.load.clinical",
                       insert.lookup = "insert.lookup.clinical",
                       insert.document = "insert.document.row" )
)