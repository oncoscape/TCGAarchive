# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)
library(jsonlite)
library(mongolite)
library(parallel)
source("bindToEnv.R")

mongo_commands <- c("mongo","mongo.manifest","mongo.lookup", "create.oCollection", "collection.exists","update.oCollection", "insert.document", "insert.document.dne")

date <- as.character(Sys.Date())
chromosomes <- c(seq(1:22), "X", "Y")

db <- "tcga"
host="mongodb://localhost"
location = "dev"

if(location == "dev"){
	user="oncoscape"
#	password = Sys.getenv("dev_oncoscape_pw")
	host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")
	#host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017","?socketTimeoutMS=36000000", sep="")
	  #?socketTimeoutMS=36000000 still fails, just waits longer
}

dataset_map <- list(
  hg19=list(name="hg19", img= "", beta="", source=""),
  pancan=list(name="Pan-Cancer", img= "DSdemo.png", beta=TRUE, source="TCGA"),
  fppp =list(name="Formalin Fixed Paraffin", img="DSdemo.png", beta=TRUE, source="TCGA"),
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
  biomarker=list(type="molecular",
            data.load = "os.create.biomarker.tree",
            insert.lookup = "insert.lookup.sourceTypeCollection",
            insert.document = "insert.document.list" ),
  cluster=list(type="calculated",
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
             insert.document = "insert.document.list" ),
  ptdegree=list(type="edges",
             data.load = "os.data.load.XXX",
             insert.lookup = "insert.lookup.network",
             insert.document = "insert.document.list" ),
  genedegree=list(type="edges",
             data.load = "os.data.load.XXX",
             insert.lookup = "insert.lookup.network",
             insert.document = "insert.document.list" ),
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
  followup=list(type="clinical",
                data.load = "os.data.load.clinical",
                insert.lookup = "insert.lookup.clinical",
                insert.document = "insert.document.row" ),
  newtumor=list(type="clinical",
               data.load = "os.data.load.clinical",
               insert.lookup = "insert.lookup.clinical",
              insert.document = "insert.document.row" ),
 `newtumor-followup`=list(type="clinical",
               data.load = "os.data.load.clinical",
              insert.lookup = "insert.lookup.clinical",
              insert.document = "insert.document.row" ),
  othermalignancy=list(type="clinical",
               data.load = "os.data.load.clinical",
                insert.lookup = "insert.lookup.clinical",
                insert.document = "insert.document.row" ),
 samplemap=list(type="clinical",
                      data.load = "os.data.load.clinical",
                      insert.lookup = "insert.lookup.clinical",
                      insert.document = "insert.document.list" )
 
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

#	rm(mongo.manifest)
#	rm(mongo.lookup)
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
  insert.collection(oCollection, result = mut.tbl, ...)
}
#---------------------------------------------------------
### return TRUE if collection name exists in db
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
### return TRUE if collection name exists in db
document.exists <- function( oCollection){
  
  con <- mongo(oCollection$collection, db=db, url=host)
  
  if(con$count() == 0){
#   print(paste(oCollection$collection, "collection does not exist"))
   rm(con)
   return(FALSE)
  }  
  
  uKeys = oCollection[["process"]][oCollection$uniqueKeys]
  query = toJSON(uKeys, auto_unbox = T)
  # find documents that have the key:value pairs of unique fields for the collection type
  
  if(con$count(query) == 0){
    # document does not exist in collection
    rm(con)
    names(uKeys) <- paste("process", names(uKeys), sep=".")
    q = uKeys; 
    q[["dne"]] = list("$exists"=TRUE); q["dataset"] = oCollection$dataset
    con = mongo.manifest$find(toJSON(q, auto_unbox = T))
    count <- length(con)
    
    if(count != 0){
      print(paste(paste(uKeys, collapse=";"), " does not exist: ",con$dne, sep=""))
      # Collection type processed, but marked as Does Not Exist 
      #   (eg PCA on singular matrices or geneset does not overlap molecular table)
      return(TRUE)
    }  
    
    return(FALSE)
    #document does not exist in collection and not marked as DNE
  }

  print(paste(paste(uKeys, collapse=";"), "fields matched in collection", oCollection$collection))
  # at least one doc exists in collection with the specified unique fields
  return(TRUE)
}
#---------------------------------------------------------
update.oCollection <- function(oCollection, dataset=NA, dataType=NA,source=NA,uniqueKeys=NA, parent=NA, process=NA){
  
  newCollection = as.list(oCollection)
  if(!missing(dataset)) newCollection$dataset = dataset
  if(!missing(dataType)) newCollection$dataType = dataType
  if(!missing(source)) newCollection$source = source
  if(!missing(uniqueKeys)) newCollection$uniqueKeys = uniqueKeys
  if(!missing(process)) newCollection$process = process
  if(!missing(parent)) newCollection$parent = parent
  
  newCollection$collection <- collection.create.name(newCollection)
  
  return(newCollection)
}
#---------------------------------------------------------
create.oCollection <- function(dataset, dataType,source, uniqueKeys, parent, process){
 
  source <- unique(source)
  if(length(source)>1) source <- list(source)

  newCollection <- list(dataset=dataset, dataType=dataType, date=date) 
  newCollection$source <- source
  newCollection$process <- process
  newCollection$uniqueKeys <- uniqueKeys
  newCollection$parent <- parent

  newCollection$collection <- collection.create.name(newCollection)
  
  return(newCollection)
}
#---------------------------------------------------------
collection.create.name <- function( oCollection){
  
  source <- unique(oCollection$source)
  if(length(source)>1) source <- list(source)
  sourceName <- paste(unlist(source), collapse="-")
  
#  collection.uniqueName <- paste(oCollection$dataset, oCollection$dataType, sourceName, oCollection$processName, sep="_")
  collection.class = mongo("lookup_dataTypes", db=db, url=host)$distinct("class", toJSON(list("dataType"=oCollection$dataType), auto_unbox = T))
  collection.uniqueName <- paste(oCollection$dataset, collection.class, sep="_")
  collection.uniqueName <- gsub("\\s+", "", tolower(collection.uniqueName))
  collection.uniqueName <- gsub("\\+", "", collection.uniqueName)
  
  return(collection.uniqueName)
}
#---------------------------------------------------------
append.collections <- function(oCollection1, oCollection2, oCollection = NA){
  
  if(is.na(oCollection))
    oCollection  <- update.oCollection(oCollection1, parent=c(oCollection1$`_id`, oCollection2$`_id`), processName="merged")

  con1 <- mongo(oCollection1$collection, db=db, url=host)
  con2 <- mongo(oCollection2$collection, db=db, url=host)
  con  <- mongo(oCollection$collection,  db=db, url=host)
  
  if(con1$count() > con2$count()){
    con1$aggregate(paste('[{"$match": {} }, { "$out": "',oCollection$collection,'" }]' , sep=""))
    con$insert(con2$find())
  } else {
    con2$aggregate(paste('[{"$match": {} }, { "$out": "',oCollection$collection,'" }]' , sep=""))
    con$insert(con1$find())
  }
  
  ## add document to manifest & lookup collection
  mongo.manifest$insert( toJSON(oCollection, auto_unbox=T))
  mongo.lookup$insert(oCollection)
}
#---------------------------------------------------------
merge.collections <- function(oCollection1, oCollection2, oCollection = NA){
  
  if(is.na(oCollection))
    oCollection  <- update.oCollection(oCollection1, parent=c(oCollection1$`_id`, oCollection2$`_id`), processName="merged")
  
  con1 <- mongo(oCollection1$collection, db=db, url=host)
  con2 <- mongo(oCollection2$collection, db=db, url=host)
  con  <- mongo(oCollection$collection,  db=db, url=host)
  
  c1 = con1$find();
  c2 = con2$find();
  uIds = unique(c1$id)
  sapply(uIds, function(uid){
    d1 = subset(c1, id==uid)
    d2 = subset(c2, id==uid)
    d = list(id=uid, min=min(d1$min, d2$min), max=max(d1$max, d2$max), data=c(d1$data, d2$data))
    con$insert(toJSON(d, auto_unbox = T))
    })
  
  ## add document to manifest & lookup collection
  mongo.manifest$insert( toJSON(oCollection, auto_unbox=T))
  mongo.lookup$insert(oCollection)
  
}
#---------------------------------------------------------
insert.prep <- function(oCollection, method="skip"){
  #methods: skip, append, replace
  #collection with name based on: dataset, dataType,source, processName, parent, process
  
  prev.run <- collection.exists(oCollection$collection)
  # Skip pre-existing collections
  if(prev.run & method == "skip"){ return(FALSE) }
  
  # Remove Collection from db, lookup, and manifest for replacement
  if(prev.run & method == "replace"){ 
    remove.collection(oCollection)
    return(TRUE) 
  }
  
  con = mongo.manifest$find(toJSON(list(collection=oCollection$collection, dne=list("$exists"=TRUE)), auto_unbox = T))
  count <- length(con)
  
  if(count != 0){
    print(paste(oCollection$collection, " does not exist: ",con$dne, sep=""))
    # Skip collections that are marked as Does Not Exist 
    #   (eg geneset does not overlap molecular table)
    return(FALSE)
  }  
  
  return(TRUE)
}
#---------------------------------------------------------
insert.lookup.sourceTypeCollection <- function(oCollection){
  
  dataType<- mongo("lookup_dataTypes", db=db, url=host)$distinct("class", toJSON(list(dataType=oCollection$dataType), auto_unbox = T))
  lookupType = lookupList[[dataType]]$type
  add.collection <- list(source=oCollection$source, type=oCollection$dataType, collection=oCollection$collection)
  
  query = list(disease=oCollection$dataset)
  query[lookupType]=list("$elemMatch"=add.collection)
  coll.match <- mongo.lookup$find(toJSON(query, auto_unbox=T))
  if(length(coll.match)>0){
    return(NA)
  }
    
  new.collection = list(); 
  new.collection[[lookupType]] = add.collection
  push.collection = list("$push"=new.collection)
  
  return(push.collection)
} 
#---------------------------------------------------------
insert.lookup.clinical <- function(oCollection){
  
  clinical.field = mongo.lookup$find(query=paste('{"disease":"',oCollection$dataset, '"}', sep=""), fields= paste('{"clinical.', oCollection$dataType, '":1}', sep=""))
  
  #clinField =paste(clinical, oCollection$dataType, sep=".");  
  #query = list(disease=oCollection$dataset); query[['$exists']][[clinField]]=TRUE;
  #clinical.field = mongo.lookup$find(query=toJSON(query, auto_unbox = T), fields= paste('{"clinical.', oCollection$dataType, '":1}', sep=""))
  
#  if(ncol(clinical.field) >0 & nchar(clinical.field[,2]) > 0 ){
#    existingCollection <- mongo.manifest$find(query=paste('{"collection":"',clinical.field[,2],'"}',sep=""), fields='{}')
#    newCollection      <- mongo.manifest$find(query=paste('{"collection":"',oCollection$collection,'"}',sep=""), fields='{}')
    
#    mergeCollection <- update.oCollection(existingCollection, parent=c(existingCollection$`_id`, newCollection$`_id`), processName="merged")
#    oCollection <- merge.collections(newCollection, existingCollection, mergeCollection)
    
#  }
  
    add.collection <- list()
    add.collection[paste("clinical",oCollection$dataType, sep=".")] <- oCollection$collection
    set.collection = list("$set"=add.collection)
 
  return(set.collection)
}
#---------------------------------------------------------
insert.lookup.network <- function(oCollection){
  ptweights   <- gsub("\\s+", "", tolower(paste(oCollection$dataset, "ptDegree", oCollection$source, oCollection$processName, sep="_")))
  geneweights <- gsub("\\s+", "", tolower(paste(oCollection$dataset, "geneDegree", oCollection$source, oCollection$processName, sep="_")))
  add.collection <- list(name=oCollection$process$geneset,source=oCollection$source, edges=oCollection$collection, 
                                    patientWeights=ptweights, 
                                    genesWeights=geneweights)
 
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
  
  dataType<- mongo("lookup_dataTypes", db=db, url=host)$distinct("class", toJSON(list(dataType=oCollection$dataType), auto_unbox = T))
  if(dataType %in% names(lookupList)){
    if(dataType %in% c("ptdegree", "genedegree")){
      print(paste(dataType, "lookup info processed with edge creation", sep=" "))
    }else{
      oLookup = do.call(lookupList[[dataType]][["insert.lookup"]],list(oCollection))
      ## insert lookup into mongo collection
      if(!is.na(oLookup))
        mongo.lookup$update(query, toJSON(oLookup, auto_unbox = T), upsert=T)
    }
  }else{
      print(paste("WARNING: data type not recognized:", dataType, sep=" "))
  }
}
#---------------------------------------------------------
insert.document.geneset = function(con, result){
  #  insert.pass <- sapply(rownames(result), function(genesetName){
  #    status = con$insert(
  #      toJSON( list( name=genesetName, genes=result[genesetName,])
  #              , auto_unbox=T, na="null")); 
  #    status$nInserted;
  #  })
  #  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result) ) )
  #}
  insert.pass <- apply(result,1, function(row){
    status = con$insert(
      toJSON( list(name=row[["name"]],genes=row[["genes"]])
              , auto_unbox=T)); 
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
  return (c(n.pass= sum(unlist(insert.pass)), n.records = nrow(result$data) ) )
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
insert.collection.dne <- function(oCollection, reason){

  if(class(oCollection) != "list") oCollection <- as.list(oCollection)
  oCollection$dne = reason
  
  mongo.manifest$insert( toJSON(oCollection, auto_unbox=T))
}
#---------------------------------------------------------
insert.document <- function(oCollection, result, ...){
  
  if(class(oCollection) != "list") oCollection <- as.list(oCollection)
  ## insert new collection data
  con <- mongo(oCollection$collection, db=db, url=host)
  
  #      doc.pass <- insert.prep(oCollection, ...)
  #      if(!doc.pass){print("Skipping."); return()}
  
  print(paste(oCollection$dataset, oCollection$dataType, oCollection$collection))
  insert.pass =0; 
  if(is.list(result)) numRecords=length(result)
  else numRecords = nrow(result)
  
    ## insert each document into collection 
    insert.status = do.call("insert.document.list", list(con,result))
    ## add document to manifest collection
    mongo.manifest$insert( toJSON(oCollection, auto_unbox=T))
    #add record to lookup
    insert.lookup(oCollection)

  rm(con)
  if(insert.status["n.pass"] != insert.status["n.records"]){  
    print(paste("ERROR: not all documents properly inserted in ", oCollection$collection, insert.status["n.pass"], "of",insert.status["n.records"]))
    remove.document(oCollection);
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
insert.collection <- function(oCollection, result, ...){
  
    if(class(oCollection) != "list") oCollection <- as.list(oCollection)
  ## insert new collection data
      con <- mongo(oCollection$collection, db=db, url=host)

#      doc.pass <- insert.prep(oCollection, ...)
#      if(!doc.pass){print("Skipping."); return()}

      print(paste(oCollection$dataset, oCollection$dataType, oCollection$collection))
      
      if(oCollection$dataType %in% names(lookupList)){
        ## insert each document into collection 
          insert.status = do.call(lookupList[[oCollection$dataType]][["insert.document"]], list(con,result))
        ## add document to manifest collection
          mongo.manifest$insert( toJSON(oCollection, auto_unbox=T))
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
create.oCollection.from.name <- function(collection){
  
  elements = unlist(strsplit(collection, "_"))
  oCollection = create.oCollection(dataset=elements[1], dataType=elements[2], source=elements[3], processName=elements[4], parent=NA, process=NA)
  return(oCollection)
}
#---------------------------------------------------------
remove.collections.by.name <- function(to.remove){
  sapply(to.remove, function(collection){
    oCollection <- create.oCollection.from.name(collection)
    remove.collection(oCollection)
  
  })

}
#---------------------------------------------------------
remove.collection <- function(oCollection){
  
  con <- mongo(oCollection$collection, db=db, url=host)
  if(con$count()>0)
    con$drop()
  
  mongo.manifest$remove(toJSON(list(collection=oCollection$collection), auto_unbox = T), multiple=TRUE)
  remove.lookup(oCollection)
  
  print(paste(oCollection$collection, "removed."))
}
#---------------------------------------------------------
remove.lookup <- function(oCollection){
  
  query <- toJSON(list("disease"=oCollection$dataset), auto_unbox = T)
  lookupType = lookupList[[oCollection$dataType]][["type"]]
  lookup.doc = mongo.lookup$find(query, fields=paste('{"',lookupType,'":1}',sep=""))
  
  
  collections <- lookup.doc[[lookupType]][[1]]
  
  if(lookupType %in% c("molecular", "calculated", "location", "annotation", "category")){
    matched.record = which(collections$collection == oCollection$collection)
    if(length(matched.record)>0){
      collections <- collections[-matched.record,]
      
#      collections[[matched.record]]$collection = NULL 
#      lookup.doc[[lookupType]] = collections[[1]]
    }
  }else if(lookupType %in% c("edges")){
    
    matched.record = which(oCollection$collection == collections$edges | oCollection$collection == collections$patientWeights | oCollection$collection == collections$genesWeights)
    if(length(matched.record>0))
      collections <- collections[-matched.record,]
  #  lookup.doc[[lookupType]] = collections
  }
  else if(lookupType %in% c("clinical")){
    collections <- lookup.doc[,-1]
    match.record = match(oCollection$dataType , tolower(names(collections)))
    if(!is.na(match.record))
      collections[[match.record]] = NULL
    collections <- as.list(collections)
  }
  
  update = list(); update[["$set"]][[lookupType]] = collections
  
  mongo.lookup$update(query, update=toJSON(update, auto_unbox = T))
}
#---------------------------------------------------------
insert.collection.separate<- function(name, indiv.collection){

  name <- tolower(name)
  con <- mongo(name, db=db, url=host)
  
#  if(con$count() != 0){
#    print(paste(name, " already exists. Skipping.", sep=""))
#	rm(con)
#    return()
#  }  
  
  ## add collection to database
  lapply(indiv.collection, function(item){
    con$insert(item)
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
  mtx <- molecular.df$data
  rownames(mtx) <- molecular.df$id
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
appendList <- function (x, val) {
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
  
  list.coord <- lapply(rownames(mtx), function(name){ list(id=name, d=mtx[name,])})
#  list.coord <- lapply(rownames(mtx), function(name){
#    vals <- as.list(t(mtx[name,dim.names]));
    #names(vals) = dim.names
#    vals
#  })
#  names(list.coord) <- rownames(mtx)
  return(list.coord)
}
#--------------------------------------------------------------#
scaleGenesToChromosomes <- function(genePos, chrCoordinates, scaleFactor=100000){
  
  genePos_xy <- lapply(genePos, function(gene){
    gene <- unlist(gene)
    x <- chrCoordinates[gene[1], "xOffset"]
    y <- chrCoordinates[gene[1], "yOffset"] + as.numeric(gene[2])/scaleFactor
    list(x=round(x),y=round(y))
  })
  
  return(genePos_xy)	
  
}
#--------------------------------------------------------------#
save.batch.genesets.scaled.pos <- function(scaleFactor=100000, ...){
  
  geneObj<- mongo.manifest$find(toJSON( list(dataset="hg19", dataType="genes", process=list(scale=scaleFactor)),auto_unbox = T), '{}')
  genePos_scaled <- as.list(mongo(geneObj$collection, db=db, url=host)$find())
  
  genesets <- mongo("lookup_genesets", db=db,url=host)$find()
  
  process <- list(scale=scaleFactor); 
  uniqueKeys <- c("name", "scale")
  parent <- list(geneObj$`_id`)
  
  result <- apply(genesets, 1, function(geneSet){	
    genes <- unlist(geneSet$genes)
    map_genes <- intersect(genes, names(genePos_scaled$data))
    genesetPos <- genePos_scaled$data[map_genes]
    genesetPos.list <- lapply(genesetPos, as.list)
    list(type="geneset", name=geneSet$name, scale=scaleFactor, data=genesetPos.list)
  }	)
  
  oCollection <- create.oCollection(geneObj$dataset, dataType="genesets", source=geneObj$source, uniqueKeys=uniqueKeys,parent=parent, process=process)
  insert.collection(oCollection, result, ...) 
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
