###
#       
###

# Library Imports ---------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

source("common.R")

# Configuration -----------------------------------------------------------

date <- as.character(Sys.Date())
scaleFactor = 100000

args = commandArgs(trailingOnly=TRUE)
if(length(args) != 0)
	commands <- args

#----------------------------------------------------------------------------------------------------
os.save.ptLayouts <- function(dfCollection, scaleFactor=100000){

	datatypeName= "cluster"
	
	for(i in 1:nrow(dfCollection)){
	  oCollection = dfCollection[i,]
	  data_coll <- mongo(oCollection$collection, db=db,url=host)$find()
	  data_coll$source <- oCollection$source
    if(length(data_coll)==0){
      print(paste("ERROR: collection not found - ", oCollection$collection, sep=""))
      next;
    }
	   insert.collection.separate("render_patient", list(data_coll))
	}
}

#----------------------------------------------------------------------------------------------------
os.save.pca.ptLayouts <- function(dfCollection, scaleFactor=100000){
  
  datatypeName= "cluster"
  
  for(i in 1:nrow(dfCollection)){
    oCollection = dfCollection[i,]
    data_coll <- mongo(oCollection$collection, db=db,url=host)$find()
    
    if(length(data_coll)==0){
      print(paste("ERROR: collection not found - ", oCollection$collection, sep=""))
      next;
    }
    pt_coll <- data.frame(type= datatypeName, dataset= data_coll$disease,name= paste("pca",data_coll$geneset, data_coll$type, sep="-"),
                          scale = scaleFactor,source = oCollection$source)
    pt_coll$data <- data_coll$data
    
    insert.collection.separate("render_patient", list(pt_coll))
  }
}

##----------------------------
os.color.ptLayouts <- function(scaleFactor=100000){
	  cat_colls <- mongo.manifest$find( query='{"dataType":"color"}')
	
	for(j in 1:nrow(cat_colls)){
	  oCollection = cat_colls[j,]
	  data_coll <- mongo(oCollection$collection, db=db,url=host)$find()
	  if(length(data_coll)==0){
	    print(paste("ERROR: collection not found - ", oCollection$collection, sep=""))
	    next;
	  }
	  insert.collection.separate("render_patient", list(data_coll))
	}
	
}

##----------------------------
os.copy.chromosome.layout <- function(scaleFactor=100000){
  
  datatypeName= "cluster"
  collection <- mongo.manifest$find(query=paste('{"dataset":"hg19", "dataType":"chromosome", "process.scale":',as.integer(scaleFactor),'}', sep=""))

  data_coll <- mongo(collection$collection, db=db, url=host)$find()
  insert.collection.separate("render_chromosome", list(data_coll))

  genesets <- mongo.manifest$find(query=paste('{"dataset":"hg19", "dataType":"genesets", "process.scale":',as.integer(scaleFactor),'}', sep=""))
  geneset_coll <- mongo(genesets$collection, db=db, url=host)$find()
  
  for(i in 1:nrow(geneset_coll)){
    document <- geneset_coll[i,]
    insert.collection.separate("render_chromosome", list(document))
  }
}
#----------------------------------------------------------------------------------------------------
os.save.pca <- function(scaleFactor=NA){
  
  datatypeName= "cluster"
  if(is.na(scaleFactor)){
    pca_colls <- mongo.manifest$find( query=paste('{"dataType":"pcaScores", "process.scale":null}', sep=""))
  } else{
    pca_colls <- mongo.manifest$find( query=paste('{"dataType":"pcaScores", "process.scale":',as.integer(scaleFactor),'}', sep=""))
  }
  
  for(i in 1:nrow(pca_colls)){
    oCollection <- pca_colls[i,]
    data_coll <- mongo(oCollection$collection,db=db,url=host)$find()
    data_coll$source <- oCollection$source
    insert.collection.separate("render_pca", list(data_coll))
  }
}

##----------------------------
commands <- c("patient", "pca", "chromosome")
#commands <- c("pca", "chromosome")
commands <- "patient"

connect.to.mongo()
scaleFactor = 100000

if("patient" %in% commands){
  os.color.ptLayouts(scaleFactor=scaleFactor) 
  
  mds_colls <- mongo.manifest$find( query=paste('{"dataType":"mds", "process.scale":',as.integer(scaleFactor),'}', sep=""))
  os.save.ptLayouts(mds_colls, scaleFactor=scaleFactor) 
  
  pca_colls <- mongo.manifest$find( query=paste('{"dataType":"pcaScores", "process.scale":',as.integer(scaleFactor),'}', sep=""))
  os.save.pca.ptLayouts(pca_colls, scaleFactor=scaleFactor) 
  
}
 
if("chromosome" %in% commands) 
  os.copy.chromosome.layout(scaleFactor=scaleFactor)

if("pca" %in% commands) 
  os.save.pca()

close.mongo()