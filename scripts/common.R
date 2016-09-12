# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)
library(jsonlite)
library(mongolite)

date <- as.character(Sys.Date())
chromosomes <- c(seq(1:22), "X", "Y")

db <- "tcga"
host="mongodb://localhost"
location = "dev"

if(location == "dev"){
	user="oncoscape"
	password = Sys.getenv("dev_oncoscape_pw")
	host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017", sep="")
}

dataset_map <- list(
  hg19=list(name="hg19", img= "", beta="", source=""),
  brca=list(name="Breast", img= "DSbreast.png", beta=FALSE, source="TCGA"),
  brain=list(name="Brain", img= "DSbrain.png", beta=FALSE, source="TCGA"),
  gbm=list(name="Glioblastoma", img= "DSbrain.png", beta=TRUE, source="TCGA"),
  coadread=list(name="Colorectal", img= "DScoadread.png", beta=TRUE, source="TCGA"),
  coad    =list(name="Colon", img= "DScoadread.png", beta=TRUE, source="TCGA"),
      read=list(name="Rectal", img= "DScoadread.png", beta=TRUE, source="TCGA"),
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
  stad=list(name="Stomach", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  
  kich=list(name="Kidney chromophobe", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  kirc=list(name="Kidney renal clear cell", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  kirp=list(name="Kidney renal papillary cell", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  lihc=list(name="Liver", img= "DSdemo.png", beta=TRUE, source="TCGA"),  
  skcm=list(name="Skin cutaneous melanoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  thca=list(name="Thyroid carcinoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  ucec=list(name="Uterine corpus endometrial", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  ucs=list(name="Uterine carcinosarcoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  uvm=list(name="Uveal melanoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  thym=list(name="Thymoma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  tgct=list(name="Testicular germ cell", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  pcpg=list(name="Pheochromocytoma & Paraganglioma", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  ov=list(name="Ovarian", img= "DSovary.png", beta=TRUE, source="TCGA") ,
  meso=list(name="Mesothelioma", img= "DSdemo.png", beta=TRUE, source="TCGA")
    )
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
  facs=list(type="molecular",
           data.load = "os.data.load.molecular",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.facs" ),
  mds=list(type="calculated",
           data.load = "os.data.load.XXX",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  pcaScores=list(type="calculated",
           data.load = "os.data.load.XXX",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  pcaLoadings=list(type="calculated",
                 data.load = "os.data.load.XXX",
                 insert.lookup = "insert.lookup.sourceTypeCollection",
                 insert.document = "insert.document.list" ),
  chromosome=list(type="location",
           data.load = "run.scale.chr.genes;saveChromosome_Coordinates",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  centromere=list(type="location",
           data.load = "saveCentromere_Coordinates",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  genes=list(type="location",
           data.load = "run.scale.chr.genes",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  annotation=list(type="annotation",
           data.load = "os.data.load.annotation",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.row" ),
  genesets=list(type="category",
           data.load = "os.data.load.json",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  color=list(type="category",
           data.load = "os.data.load.categories",
           insert.lookup = "insert.lookup.sourceTypeCollection",
           insert.document = "insert.document.list" ),
  edges=list(type="edges",
             data.load = "os.data.load.XXX",
             insert.lookup = "insert.lookup.network",
             insert.document = "insert.document.edges" ),
  events=list(type="clinical",
               data.load = "os.data.load.clinical.events",
               insert.lookup = "insert.lookup.clinical",
               insert.document = "insert.document.list" ),
  
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
  mut.tbl <- result
  with.mutation <- nchar(mut.tbl) > 0
  mut.tbl[with.mutation]  <- 1
  mut.tbl[!with.mutation] <- 0

  mut.tbl <- apply(mut.tbl, 2, as.numeric)
  rownames(mut.tbl) <- rownames(result)
  insert.collection(oCollection, result = mut.tbl)
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
update.oCollection <- function(oCollection, dataset=NA, dataType=NA,source=NA, processName=NA, parent=NA, process=NA){
  
  newCollection = oCollection
  if(!missing(dataset)) newCollection$dataset = dataset
  if(!missing(dataType)) newCollection$dataType = dataType
  if(!missing(source)) newCollection$source = source
  if(!missing(processName)) newCollection$processName = processName
  if(!missing(process)) newCollection$process = process
  if(!missing(parent)) newCollection$parent = parent
  
  newCollection$collection <- collection.create.name(newCollection)
  
  return(newCollection)
}
#---------------------------------------------------------
create.oCollection <- function(dataset, dataType,source, processName, parent, process){
 
  source <- unique(source)
  if(length(source)>1) source <- list(source)

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
  
  return(TRUE)
}
#---------------------------------------------------------
insert.lookup.sourceTypeCollection <- function(oCollection){
    lookupType = lookupList[[oCollection$dataType]]$type
    add.collection <- list(source=oCollection$source, type=oCollection$dataType, collection=oCollection$collection)
    new.collection = list(); 
    new.collection[[lookupType]] = add.collection
    push.collection = list("$push"=new.collection)

  return(push.collection)
} 
#---------------------------------------------------------
insert.lookup.clinical <- function(oCollection){
  add.collection <- list()
  add.collection[oCollection$dataType] <- oCollection$collection
  new.collection = list(); 
  new.collection[["clinical"]] = add.collection
  push.collection = list("$push"=new.collection)

  return(push.collection)
}
#---------------------------------------------------------
insert.lookup.network <- function(oCollection){
  ptweights   <- gsub("\\s+", "", tolower(paste(oCollection$dataset, "ptDegree", oCollection$source, oCollection$processName, sep="_")))
  geneweights <- gsub("\\s+", "", tolower(paste(oCollection$dataset, "geneDegree", oCollection$source, oCollection$processName, sep="_")))
  add.collection <- list(data.frame(name=oCollection$process$geneset,source=oCollection$source, edges=oCollection$collection, 
                                    patientWeights=ptweights, 
                                    genesWeights=geneweights))
 
  new.collection = list(); 
  new.collection[["edges"]] = add.collection
  push.collection = list("$push"=new.collection)
  
  return(push.collection)
}
#---------------------------------------------------------
insert.lookup <- function(oCollection){
  
  ## add record to lookup collection
  dataset = oCollection$dataset
  query <- toJSON(list("disease"=dataset), auto_unbox = T)
  oLookup <- mongo.lookup$find(query)
  #fields = list(); fields[[lookupList[[oCollection$dataType]]$type]] = 1;
  #oLookup <- mongo.lookup$find(query, fields = toJSON(fields, auto_unbox = T))
  
  if(length(oLookup)==0){
      #query found nothing - dataset not stored yet
      oLookupDoc <- list(disease = dataset, source = dataset_map[[dataset]]$source,beta = dataset_map[[dataset]]$beta)
      oLookupDoc$name = dataset_map[[dataset]]$name
      oLookupDoc$img = dataset_map[[dataset]]$img
      mongo.lookup$insert(oLookupDoc, db=db, url=host)
  }
  
  dataType = oCollection$dataType
  if(dataType %in% names(lookupList)){
    oLookup = do.call(lookupList[[dataType]][["insert.lookup"]],list(oCollection))
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
insert.document.geneset = function(con, result){
  insert.pass <- sapply(rownames(result), function(genesetName){
    status = con$insert(
      toJSON( list( name=genesetName, genes=result[genesetName,])
              , auto_unbox=T, na="null")); 
    status$nInserted;
  })
  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}

#---------------------------------------------------------
insert.document.molecular = function(con, result){
  insert.pass <- sapply(rownames(result$data), function(geneName){
    status = con$insert(
      toJSON( c(result$ids[[geneName]], list( min=min(result$data[geneName,]), max=max(result$data[geneName,]), patients = as.list(result$data[geneName,])) )
              , auto_unbox=T, na="null")); 
    status$nInserted;
  })
  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}
#---------------------------------------------------------
insert.document.facs = function(con, result){
  insert.pass <- sapply(colnames(result), function(ptName){
    status = con$insert(
      toJSON( list(patient=ptName, markers = as.list(result[,ptName]))
              , auto_unbox=T, na="null")); 
    status$nInserted;
  })
  
  return (c(n.pass= sum(unlist(insert.pass)), n.records = ncol(result) ) )
}
#---------------------------------------------------------
insert.document.annotation = function(con, result){
  insert.pass <- sapply(rownames(result), function(idName){
    status = con$insert(
      toJSON( list(id=idName, data = as.list(result[idName,]))
              , auto_unbox=T)); 
    status$nInserted;
  })

  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}

#---------------------------------------------------------
insert.document.list = function(con, result){
  insert.pass <- sapply(result, function(el){
    status = con$insert(
      toJSON( el
              , auto_unbox=T, na="null")); 
    status$nInserted;
  })
  
  return (c(n.pass= sum(unlist(insert.pass)), n.records = length(result) ) )
}
#---------------------------------------------------------
insert.document.row = function(con, result){
  insert.pass <- sapply(rownames(result), function(idName){
    status = con$insert(
      toJSON( as.list(result[idName,])
              , auto_unbox=T, na="null")); 
    status$nInserted;
  })
  
  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
}

#---------------------------------------------------------
insert.document.geneset = function(con, result){
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
      
      if(oCollection$dataType %in% names(lookupList)){
        ## insert each document into collection 
          insert.status = do.call(lookupList[[oCollection$dataType]][["insert.document"]], list(con,result))
        ## add document to manifest collection
          mongo.manifest$insert( oCollection)
        #add record to lookup
          insert.lookup(oCollection)
          
      } else{
        print(paste("WARNING: data type not recognized for insert.collection:", dataType))
        insert.pass =0; 
        if(is.list(result)) numRecords=length(result)
        else numRecords = nrow(result)
      }
      
      rm(con)
      if(insert.status["n.pass"] != insert.status["n.records"]){  
        print(paste("ERROR: not all documents properly inserted in ", oCollection$collection, insert.status["n.pass"], "of",insert.status["n.records"]))
        remove.collection(oCollection);
      }
      ### --- FINISH insert into Mongo    
      
  if(oCollection$dataType == "mut"){
    newID <-  mongo.manifest$find(query=toJSON(oCollection, auto_unbox = T), fields='{"_id":1}')
    new.oCollection <- oCollection
    new.oCollection$dataType = "mut01"
    new.oCollection$parent = newID
    new.oCollection$collection <- collection.create.name(new.oCollection)
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
    con$insert(toJSON(item, auto_unbox = T))
  })
  rm(con)
 
}

#---------------------------------------------------------
convert.to.mtx <- function(molecular.df, format=""){
#  mtx <- apply(molecular.df,1, function(geneRow){ 
#    val <-geneRow$patients; 
#    null.val <- which(unlist(lapply(val, is.null)))
#    if(length(null.val)>0) val[null.val] <- NA
#    val <- unlist(val);
#    if(format == "as.numeric") val <- as.numeric(val)
#    val})
  mtx <- molecular.df$patients
  rownames(mtx) <- molecular.df$gene
#  colnames(mtx) <- molecular.df$gene
#  rownames(mtx) <- names(molecular.df[1, "patients"])
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
  
  chrPosScaledObj <- mongo.manifest$find(toJSON(list(dataset="hg19",dataType="chromosome", process=list(scale=scaleFactor)), auto_unbox = T))
  
  chrCoord <- mongo(chrPosScaledObj$collection, db=db, url=host)$find()$data
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
    vals <- as.list(t(mtx[name,dim.names]));
    names(vals) = dim.names
    vals
  })
  names(list.coord) <- rownames(mtx)
  return(list.coord)
}
#--------------------------------------------------------------#
scaleGenesToChromosomes <- function(genePos, chrCoordinates, scaleFactor=1000){
  
  genePos_xy <- lapply(genePos, function(gene){
    gene <- unlist(gene)
    x <- chrCoordinates[gene[1], "xOffset"]
    y <- chrCoordinates[gene[1], "yOffset"] + as.numeric(gene[2])/scaleFactor
    list(x=round(x),y=round(y))
  })
  
  return(genePos_xy)	
  
}

#--------------------------------------------------------------#
save.batch.genesets.scaled.pos <- function(scaleFactor=100000){
  
  geneObj<- mongo.manifest$find(toJSON( list(dataset="hg19", dataType="genes", process=list(scale=scaleFactor)),auto_unbox = T), '{}')
  genePos_scaled <- as.list(mongo(geneObj$collection, db=db, url=host)$find())
  
  genesetObj <-  mongo.manifest$find( toJSON( list(dataset="hg19",dataType="genesets"), auto_unbox = T), '{}')
  genesets <- mongo(genesetObj$collection, db=db,url=host)$find()
  
  process <- list(scale=scaleFactor); 
  processName <- paste(process, collapse="-")
  parent <- list(geneObj$`_id`,genesetObj$`_id`)
  
  result <- apply(genesets, 1, function(geneSet){	
    genes <- unlist(geneSet$genes)
    map_genes <- intersect(genes, names(genePos_scaled$data))
    genesetPos <- genePos_scaled$data[map_genes]
    genesetPos.list <- lapply(genesetPos, as.list)
    list(type="geneset", name=geneSet$name, scale=scaleFactor, data=genesetPos.list)
  }	)
  
  oCollection <- create.oCollection(geneObj$dataset, dataType="genesets", source=geneObj$source, processName=processName,parent=parent, process=process)
  insert.collection(oCollection, result) 
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
