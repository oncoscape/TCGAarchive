# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)
library(jsonlite)
library(rmongodb)

date <- as.character(Sys.Date())
chromosomes <- c(seq(1:22), "X", "Y")

db <- "pancan12"
#db <- "ClinicalEvent"

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
connect.to.rmongodb <- function(host= "127.0.0.1", name = "", username = "", password = "", db = "admin"){
	mongo <- mongo.create(host = host, name = name, username = username,
  							password = password, db = db, timeout = 0L)
	
	stopifnot(mongo.is.connected(mongo))
	return(mongo)
}
#---------------------------------------------------------
connect.to.mongo <- connect.to.rmongodb

#---------------------------------------------------------
## mongolite requires all insertions to be of type data.frame
connect.to.mongolite <- function(){
#  mongo <- mongo(collection=collection, db=db, url=host)
  
  mongo.manifest <<- mongo(collection="manifest",db=db, url=host)
  mongo.lookup <<- mongo(collection="lookup_oncoscape_datasources",db=db, url=host)
  
}
#---------------------------------------------------------
## RMongo v0.1.0 from github (only 0.0.25 deposited in CRAN) 
## Minimal updates to code: not actively supported??
## Has javascript versioning dependencies (mine:java version "1.6.0_65", and updated to "1.8.0_101-b13")
## Error in .jnew("rmongo/RMongo", dbName, hosts, TRUE, username, pwd) : 
##    java.lang.UnsupportedClassVersionError: rmongo/RMongo : Unsupported major.minor version 51.0
## http://stackoverflow.com/questions/10382929/how-to-fix-java-lang-unsupportedclassversionerror-unsupported-major-minor-versi
connect.to.rmongo <- function(db, host="127.0.0.1:27107"){
  host="oncoscape-dev-db1.sttrcancer.io:27017"
  mongo <- mongoDbReplicaSetConnectWithCredentials(db, hosts=host, username, pw)
  
  dbDisconnect(mongo)
  
}
  
#---------------------------------------------------------
close.mongo <- function(mongo){

	if(mongo.is.connected(mongo) == TRUE) {
	  # close connection
	  mongo.destroy(mongo)
	}
}

#---------------------------------------------------------
mongo.collection.as.matrix <- function(collection, format=""){
### NOT ACTUALLY IMPLEMENTED.  Would converting the list object from a cursor and adding it 
### to a predefined object (with known size) reduce compute time and storage needs?
  
  cursor <- mongo.find(mongo, paste("oncoscape",collection, sep="."), query=list(), fields=list())
  count <- mong.count(mongo, paste("oncoscape",collection, sep="."))
  result_lst <- vector('list', count)
  i <- 1
  while (mongo.cursor.next(cursor)) {
    result_lst[[i]] <- mongo.bson.to.list(mongo.cursor.value(cursor))
    val <-geneRow$patients; 
    null.val <- which(unlist(lapply(val, is.null)))
    if(length(null.val)>0) val[null.val] <- NA
    val <- unlist(val);
    if(format == "as.numeric") val <- as.numeric(val)
    
    i <- i + 1
  }
  result_dt <- data.table::rbindlist(result_lst)

  colnames(mtx) <- sapply(data.list, function(geneRow){ geneRow$gene})
  rownames(mtx) <- names(data.list[[1]]$patients)
  return(mtx)  
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
### For any mutation file, create and save an indicator mut01 file
save.mut01.from.mut <- function(mongo,db, dataset, dataType="mut01",source, result,
                                parent, process,processName){
  mut.list <- result
  
  data.list <- lapply(result, function(geneSet){
    patients <- lapply(geneSet$patients, function(pt){mut <- nchar(pt); mut01 <- ifelse(mut > 0, 1, 0 ); mut01 })
    list(gene=geneSet$gene,min=min(unlist(patients)), max=max(unlist(patients)), patients = patients)
  })    
  
  #parent <- parentID
  
  save.collection(mongo,db, dataset, dataType="mut01",source, result=data.list,
                  parent, process,processName)
}

#---------------------------------------------------------
collection.exists <- function(mongo,db, dataset, dataType,source,processName){

  source <- unique(source)
  if(length(source)>1) source <- list(source)
  sourceName <- paste(unlist(source), collapse="-")

  collection.uniqueName <- paste(dataset, dataType, sourceName, processName, sep="_")
  collection.uniqueName <- gsub("\\s+", "", tolower(collection.uniqueName))
  collection.ns <- paste(db, collection.uniqueName, sep=".")
  if(mongo.count(mongo, collection.ns) != 0){
    print(paste(collection.uniqueName, " already exists.", sep=""))
    return(TRUE)
  }  
  return(FALSE)

}
#---------------------------------------------------------
remove.collection.byName <- function(mongo,db, collection){

  ##TO DO: rerun render_XXX collections?  eg drop an mds collection triggers rewrite of render_patient?
  
  #remove collection data
		mongo.drop(mongo,db, collection)
  #remove manifest entry
  		mongo.remove(mongo, paste(db, "manifest", sep="."), criteria=list(collection=collection))

  # remove lookup_oncoscape_datasource entry
		parseVals <- unlist(strsplit(collection,"_"))
		dataset <- parseVals[1]
		dataType = parseVals[2]
		
		if(dataType %in% c("patient", "drug", "radiation", "followUp-v1p0","followUp-v1p5", "followUp-v2p1", "followUp-v4p0", "newTumor", "newTumor-followUp-v4p0", "otherMalignancy-v4p0")){
		  query <- list(disease=dataset,dataType=dataType)
		  query[[dataType]] <- collection
		  mongo.remove(mongo, paste(db, "lookup_oncoscape_datasources", sep="."), 
		               query=query)
		               
		} else if(dataType %in% c("edges","ptDegree","geneDegree")){
		  query <- list(disease=dataset,dataType=dataType)
		  colType <- ifelse(dataType=="edges", "edges", ifelse(dataType=="ptDegree","patientWeights", "genesWeights"))
		  query[[colType]] <- collection
		  mongo.remove(mongo, paste(db, "lookup_oncoscape_datasources", sep="."), 
		               query=query)
		  
		}
		else{
		  query=list(disease=dataset,dataType=dataType)

      if(dataType %in% c("cnv","mut01", "mut", "rna", "protein", "methylation")){
        query[["molecular"]] <- list(collection=collection) 
		  }else if(dataType %in% c("mds", "pcaScores")){
		    query[["calculated"]] <- list(collection=collection) 		               
		  }else if(dataType %in% c("chromosome", "centromere", "genes")){
		    query[["location"]] <- list(collection=collection) 		               
	  	}else if(dataType %in% c("genesets", "color")){
	  	  query[["category"]] <- list(collection=collection) 		}
		  else{ print(paste("ERROR: datatype not recognized in lookup table- ", dataType, sep=""));
		        return()
		  }
		  mongo.remove(mongo, paste(db, "lookup_oncoscape_datasources", sep="."), 
		               query=query)
		  
		}

}

#---------------------------------------------------------
save.indiv.collection<- function(mongo,db,name, indiv.collection){

  name <- tolower(name)
  
  if(mongo.count(mongo, paste(db, name, sep=".")) != 0){
    print(paste(name, " already exists. Skipping.", sep=""))
    return()
  }  
  
  
  ## add collection to database
  lapply(indiv.collection, function(item){
    mongo.insert(mongo, paste(db, name, sep="."), item)
  })
 
}

#---------------------------------------------------------
save.collection<- function(mongo,db, dataset, dataType,source,result, parent, process,processName){
  
  cat("-save collection\n")
  
  source <- unique(source)
  if(length(source)>1) source <- list(source)
  sourceName <- paste(unlist(source), collapse="-")
  
  collection.uniqueName <- paste(dataset, dataType, sourceName, processName, sep="_")
  collection.uniqueName <- gsub("\\s+", "", tolower(collection.uniqueName))
  collection.ns <- paste(db, collection.uniqueName, sep=".")
  if(mongo.count(mongo, collection.ns) != 0){
    print(paste(collection.uniqueName, " already exists. Skipping.", sep=""))
    return()
  }  
  
  newCollection <- list(dataset=dataset, dataType=dataType, date=date) 
  newCollection$collection <- collection.uniqueName
  newCollection$source <- source
  newCollection$process <- process
  newCollection$parent <- parent
  
  ## add record to manifest collection
  mongo.insert(mongo, paste(db, "manifest", sep="."), newCollection)
  
  ## insert new collection data
  pass <- lapply(result, function(el){mongo.insert(mongo, collection.ns, as.list(el))})
  if(!all(unlist(pass))){
    print(paste("ERROR: result not inserted into mongodb: ", collection.uniqueName, sep=""))
    return()
  }
  
  newID <-  mongo.find.one(mongo, paste(db, "manifest", sep="."), 
                           query=newCollection, fields=list("_id"))
  
  ## add record to lookup collection
  lookup.ns <-  paste(db, "lookup_oncoscape_datasources", sep=".")
  query <- list("disease"=dataset)
  datasource <- mongo.find.one(mongo, lookup.ns, query)
  
  if(length(datasource)==0){
    data.list <- list(disease = dataset, source = dataset_map[[dataset]]$source,beta = dataset_map[[dataset]]$beta)
    data.list$name = dataset_map[[dataset]]$name
    data.list$img = dataset_map[[dataset]]$img
  }else{
    data.list <- mongo.bson.to.list(datasource)
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
  mongo.update(mongo, lookup.ns, query, data.list, mongo.update.upsert)
  
  if(dataType == "mut")
    save.mut01.from.mut(mongo,db, dataset, dataType="mut01",source,result=result, parent=newID, process, processName)
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
