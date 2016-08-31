library(org.Hs.eg.db)
library(jsonlite)

rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors=FALSE)

source("common.R")

args = commandArgs(trailingOnly=TRUE)
if(length(args) != 0)
	commands <- args

date <- as.character(Sys.Date())

#----------------------------------------------------------------------------------------------------
getGeneSet <- function(geneset_name){
  match_name <- which(sapply(genesets, function(set){set$name ==geneset_name}))
  if(length(match_name) == 0)
    return(NA)
  
	return(genesets[[match_name]]$genes)
}

#----------------------------------------------------------------------------------------------------
calcSimilarity <- function(indicatorMatrix) {
	similarity=NULL
	similarity <- apply(indicatorMatrix,2, function(ptCol){
		ptCol %*% indicatorMatrix
	})
	diag(similarity) <- 1
	rownames(similarity) <- colnames(indicatorMatrix)
	colnames(similarity) <- colnames(indicatorMatrix)
	return(similarity)
}

#----------------------------------------------------------------------------------------------------
calculateSampleSimilarityMatrix <- function (mut, cn, samples=NA, genes=NA, copyNumberValues=c(-2, 2), threshold=NA) {

    if(!all(is.na(samples))){
        mut <- mut[,intersect(colnames(mut), samples)]
        cn  <- cn[ ,intersect(colnames(cn) , samples)]
    }

    if(!all(is.na(genes))){
        mut <- mut[intersect(rownames(mut), genes),]
        cn  <- cn[ intersect(rownames(cn) , genes),]
    }

  if(any(dim(mut)<3) | any(dim(cn)<3)){
    print("WARNING: mtx does not match gene/pt set.  Less than 3 observations.")
    return(matrix());
  }
  
	#remove any genes with NA in mutation
	tmp <- apply(mut, 1, function(x) any(is.na(x)))
	if(length(which(tmp))>0)
		mut <- mut[-which(tmp),]
	tmp <- apply(cn, 1, function(x) any(is.na(x)))
	if(length(which(tmp))>0)
	  cn <- cn[-which(tmp),]

	if(any(dim(mut)<3) | any(dim(cn)<3)){
	  print("WARNING: mtx does not match gene/pt set.  Less than 3 observations.")
	  return(matrix());
	}
	
	similaritySNV <- calcSimilarity(as.matrix(mut))
	similarityCNV <- calcSimilarity(as.matrix(cn))

	sharedSnvCnv <- intersect(rownames(similaritySNV), rownames(similarityCNV))
	simSNV <- similaritySNV[sharedSnvCnv, sharedSnvCnv]
	simCNV <- similarityCNV[sharedSnvCnv, sharedSnvCnv]

	SNV.CNV <- ((simSNV)/sum(simSNV)) + 
			   ((simCNV)/sum(simCNV))

	D <- as.dist(max(SNV.CNV) - SNV.CNV)
	tbl.pos <- cmdscale(D, k=2) #MDS.SNV.CNV
	colnames(tbl.pos) <- c("x", "y")
	tbl.pos <- as.data.frame(tbl.pos)

#	 ptIDs <- canonicalizePatientIDs(obj@pkg, rownames(tbl.pos))
#	 tbl.pos <- tbl.pos[!duplicated(ptIDs),]
#     rownames(tbl.pos) <- ptIDs[!duplicated(ptIDs)]
     
     return(tbl.pos)
}

#----------------------------------------------------------------------------------------------------
save.pca<- function(collection, geneset=NA, scaleFactor=NA){

  cat("-calculating pca\n")
  
  ## ----- Configuration ------
  genesetName <- geneset
  if(is.na(genesetName)) genesetName = "All Genes"
	process <- data.frame(calculation="prcomp", geneset= genesetName)
	process$input=collection$dataType
	if(collection$dataType %in% c("rna", "methylation"))
	  process$input=paste(collection$dataType, collection$process$type, sep="-")
	outputName <- paste(unlist(process), collapse="-")
	
	process$scale=scaleFactor
	processName <- paste(unlist(process), collapse="-")
	process$center="TRUE"; process$scaled="TRUE"
	process <- list(process)

	prev.run <- collection.exists(mongo,db, collection$dataset, dataType="pcaScores",
	                              source=collection$source,processName=outputName)
	if(prev.run){
	  print("Skipping.")
	  return();
	}
	
	coll <- mongo.find.all(mongo, paste("oncoscape",collection$collection, sep="."))
	
	mtx <- convert.to.mtx(coll, format="as.numeric");
	rm(coll);

	if(!is.na(geneset)){
	  genes <- getGeneSet(geneset)
	  mtx <- mtx[, intersect(colnames(mtx), genes), drop=F]
	}

	if(any(dim(mtx)<3)){
	  print("WARNING: mtx does not match gene/patient set.")
	  return();
	}
	
	column.sums <- colSums(mtx, na.rm=TRUE)
	removers <- as.integer(which(column.sums == 0))
	removers <- c(removers, which(apply(mtx, 2, var)== 0))
	if(length(removers) > 0) {
		   printf("removing %d columns", length(removers))
		   mtx <- mtx[, -removers]
	} # if removers

	if(any(dim(mtx)<3)){
	  print("WARNING: mtx is singular.  PCA not computed")
	  return();
	}
	  
	
	   PCs <- tryCatch(
		  prcomp(na.omit(mtx),center=T,scale=T),
		  error=function(error.message){
			 print("ERROR: PRCOMP!")
		    print(error.message)
			 return(NA);
			 })
   
	   
	   if(all(is.na(PCs)))
		   return();
	
	   parent <- collection$`_id`
	   
	   scores <- PCs$x
	   colnames(scores) <- NULL
	   importance <- summary(PCs)$importance   
	   propVar <- round(importance[2,] *100, digits=2)
	   names(propVar) <- NULL

	   
	   ## ----- Save Raw ------
	   scores.list <- lapply(rownames(scores), function(name){ scores[name,1:3]})
	   names(scores.list) <- rownames(scores)
	   process$scale = NA
	   result <- list(disease=collection$dataset,source = collection$source, type=process$input, geneset=genesetName,scale=NA, pc1=propVar[1], pc2=propVar[2] ,pc3=propVar[3],data=scores.list)
     save.collection(mongo,db, dataset=collection$dataset, dataType="pcaScores",source=collection$source, result=list(result),
                     parent=parent, process=process,processName=outputName)

     ## ----- Save Scaled  ------
     if(!is.na(scaleFactor)){
	     chrDim <- get.chromosome.dimensions(scaleFactor) 
	     pc3 <- scores[,1:3]; colnames(pc3) <- c("x", "y", "z")
	     scores.list <- scaleSamplesToChromosomes(pc3, chrDim)
	     names(scores.list) <- rownames(scores)
	     process$scale = scaleFactor
	     result <- list(disease=collection$dataset,source=collection$source, type=process$input, geneset=genesetName,scale=scaleFactor, pc1=propVar[1], pc2=propVar[2] ,pc3=propVar[3],data=scores.list)
	     save.collection(mongo,db, dataset=collection$dataset, dataType="pcaScores",source=collection$source, result=list(result),
	                     parent=parent, process=process,processName=processName)
	     
     }
#	   loadings <- PCs$rotation
#	   result <- list(rowType="genes", colType="PC", rows=rownames(loadings), cols=colnames(loadings), data=loadings)
#	   Manifest <- save.collection(mongo, dataset=collection$dataset, dataType="pcaLoadings", source=collection$source, result=result,
#	                               parent=parent, process=process,processName=processName)

}


#----------------------------------------------------------------------------------------------------
save.mds.innerProduct <- function(tbl1, tbl2, geneset=NA, scaleFactor=NA, ...){
    ## ----- MDS on All Combinations of CNV and MUT Tables ------

  if(tbl1$source != tbl2$source){
    print("currently not computing mds based on different sources")
    return()
  }
  
  cat("-calculating mds\n")
  
  ## ----- Configuration ------
  dataType <- "mds"
  genesetName <- geneset
  if(is.na(genesetName)) genesetName = "All Genes"
  datasetName <- tbl1$dataset
  process <- list(calculation="mds", geneset= genesetName)
  process$input=list( tbl1$dataType, tbl2$dataType)
  outputName <- paste(c(unlist(process),tbl1$source), collapse="-")

  process$scale=scaleFactor
  processName <- paste(c(unlist(process),tbl1$source), collapse="-")
  
  prev.run <- collection.exists(mongo,db, dataset=datasetName, dataType=dataType,source=c(tbl1$source, tbl2$source),processName=processName)
  if(prev.run){
    print("Skipping.")
    return()
  }
  
	regex = "-01$"; threshold = NA;
	if(datasetName == "laml"){        regex = "-03$|-09$";
	} else if(datasetName == "luad"){ regex = "TCGA-(17)^-\\d{4}-01$" }
	process$regex=regex; process$threshold=threshold

		if(datasetName == "brca" | datasetName == "brain")  threshold = -1e-04
  
 
  	coll1 <- mongo.find.all(mongo, paste("oncoscape",tbl1$collection, sep="."))
  	coll2 <- mongo.find.all(mongo, paste("oncoscape",tbl2$collection, sep="."))
  	
		mtx.tbl1 <- convert.to.mtx(coll1, format="as.numeric");
		mtx.tbl2 <- convert.to.mtx(coll2, format="as.numeric");

		rm(coll1); rm(coll2);
		
		tbl1.samples <- grep(regex, rownames(mtx.tbl1),  value=TRUE)
		tbl2.samples <- grep(regex, rownames(mtx.tbl2),  value=TRUE)
	
		if(is.na(geneset)){
		       genes <- intersect(colnames(mtx.tbl1), colnames(mtx.tbl2))
		}else{ genes = getGeneSet(geneset) }
		
			
			samples <- unique(tbl1.samples, tbl2.samples)
			sample_similarity <- calculateSampleSimilarityMatrix(t(mtx.tbl1), t(mtx.tbl2),samples=samples, genes=genes)
											 #expects rows as genes and cols as samples
			
			if(any(dim(sample_similarity)==0)){
			  print("WARNING: mtx does not match gene/pt set.  Less than 3 observations.")
			  return();
			}
			
			sample_similarity[, "x"] <- -1 * sample_similarity[, "x"]
			sample_similarity[, "y"] <- -1 * sample_similarity[, "y"]
			
			if(!is.na(threshold)){
				outliers <- names(which(sample_similarity[,1]<threshold))
				sample_similarity <- sample_similarity[setdiff(rownames(sample_similarity), outliers), ]
			}

			parent <- list(tbl1$`_id`, tbl2$`_id`)
			
		  mds.list<- lapply(rownames(sample_similarity), function(name) data.frame(x=sample_similarity[name,"x"], y=sample_similarity[name, "y"]))
		  names(mds.list) <- rownames(sample_similarity)

		  process$scale = NA
		  process <- list(process)
			result <- list(type="cluster", dataset=tbl1$dataset, name=outputName, scale=NA, data=mds.list)
			save.collection(mongo,db, dataset=datasetName, dataType=dataType,source=c(tbl1$source, tbl2$source), result=list(result),
			                            parent=parent, process=process,processName=outputName)

			if(!is.na(scaleFactor)){
			    process[[1]]$scale = scaleFactor
			    chrDim <- get.chromosome.dimensions(scaleFactor) 
			  mds.list <- scaleSamplesToChromosomes(sample_similarity, chrDim, dim.names=c("x", "y"))
			  result <- list(type="cluster", dataset=tbl1$dataset, name=outputName, scale=scaleFactor, data=mds.list)
			  save.collection(mongo,db, dataset=datasetName, dataType=dataType,source=c(tbl1$source, tbl2$source), result=list(result),
			                  parent=parent, process=process,processName=processName)
			}			
}


#----------------------------------------------------------------------------------------------------
run.batch.patient_similarity <- function(datasets, scaleFactor=NA){

  gistic.scores <-c(-2,-1,1, 2)
  
  # Loop for each dataset
  for (collection in datasets){
    ## MDS
    if(collection$dataType =="cnv"){
      mut01_colls <- mongo.find.all(mongo, paste(db,"manifest", sep="."), 
                     query=list(dataset=collection$dataset, dataType="mut01"))
      for(mut01_coll in mut01_colls){
        save.mds.innerProduct(collection, mut01_coll, copyNumberValues=gistic.scores, geneset = NA, scaleFactor=scaleFactor)
        for(geneset in genesets){
          save.mds.innerProduct(collection, mut01_coll, copyNumberValues=gistic.scores, geneset = geneset$name, scaleFactor=scaleFactor)
        }
        
      }
    }
    else if(collection$dataType =="mut01"){
      cnv_colls <- mongo.find.all(mongo, paste(db, "manifest", sep="."), 
                                    query=list(dataset=collection$dataset, dataType="cnv"))
      for(cnv_coll in cnv_colls){
        save.mds.innerProduct(cnv_coll, collection, copyNumberValues=gistic.scores, geneset = NA, scaleFactor=scaleFactor)
        for(geneset in genesets){
          save.mds.innerProduct(cnv_coll, collection, copyNumberValues=gistic.scores, geneset = geneset$name, scaleFactor=scaleFactor)
        }
        
      }
      
    }
    
    ## PCA
      save.pca(collection, geneset = NA, scaleFactor=scaleFactor)
      for(geneset in genesets){
        save.pca(collection, geneset = geneset$name, scaleFactor=scaleFactor)
      }
	      

	} # for diseaseName	
  
}
#----------------------------------------------------------------------------------------------------
get.network_edges <- function(mtx,samples, genes, edgeTypes){

  if(all(is.na(samples))) samples <- colnames(mtx)
  if(all(is.na(genes))) genes <- rownames(mtx)
	
  samples <- intersect(samples, colnames(mtx))
  genes <- intersect(genes, rownames(mtx))
  
  mtx <- mtx[genes, samples, drop=F]
  rows <- rownames(mtx); cols <- colnames(mtx)

  allEdges <- list()
  
  for(edgeName in names(edgeTypes)){
  	matchingIndex <- which(mtx==edgeTypes[[edgeName]], arr.ind=T)
	  edgeMap <- apply(matchingIndex, 1, function(matchPair){
	    list(m=edgeName, g=rows[matchPair[1]], p=cols[matchPair[2]])
	  })
	  allEdges <- c(allEdges, edgeMap)
  }
  #colnames(allEdges) <- c("m", "g", "p")
  
#  allEdges <- apply(allEdges, 1, function(row){row})
  return(allEdges)
}
#----------------------------------------------------------------------------------------------------
save.edge.files <- function(dataset, result, source, parent, process,processName){

  save.collection(mongo,db, dataset=dataset, dataType="edges",source=source, result=result,
                              parent=parent, process=process,processName=processName)
  
  temp <- as.list(table(sapply(result,function(edge) edge$p)))
  node1_counts <- lapply(names(temp), function(el) temp[el])
  save.collection(mongo,db, dataset=dataset, dataType="ptDegree",source=source, result=node1_counts,
                              parent=parent, process=process,processName=processName)
  
  temp <- as.list(table(sapply(result,function(edge) edge$g)))
  node2_counts <- lapply(names(temp), function(el) temp[el])
  save.collection(mongo,db, dataset=dataset, dataType="geneDegree", source=source, result=node2_counts,
                              parent=parent, process=process,processName=processName)
}
#----------------------------------------------------------------------------------------------------
get.edgePairs <- function(collection, genesetName, ...){				
  
    goi <- getGeneSet(genesetName)
 
    mtx <- convert.to.mtx(collection)
    
    ## get and save edge pairs
    edgePairs <- get.network_edges(t(mtx), samples=NA, genes=goi, ...)

  return(edgePairs)
}

#----------------------------------------------------------------------------------------------------
run.batch.network_edges <- function(datasets){

  cat("-calculating edges\n")

    dataType <- "network"

    origin <- lapply(datasets , function(record){
      c(dataset = record$dataset, source = record$source)
    })
    origin <- unique(origin)
    # get unique dataset & source types
    
    # Loop for each dataset/source type, get mut &/or cnv edges
    for (collection in origin){
            
		  mut01_colls <- sapply(datasets, function(record){record$dataset== collection[["dataset"]] &
		                                                   record$source == collection[["source"]] &
		                                                   record$dataType=="mut01"})
		  mut01_colls <- datasets[mut01_colls]
      cnv_colls <- sapply(datasets, function(record){record$dataset== collection[["dataset"]] &
                                                       record$source == collection[["source"]] &
                                                       record$dataType=="cnv"})
      cnv_colls <- datasets[cnv_colls]
      
		  if(length(mut01_colls)==0 & length(cnv_colls) ==0) next;
		  cat(collection[["dataset"]], "\n")		  
		  
      for(geneset in genesets){
        EdgeList_mut <- EdgeList_cnv <- list()
        parent <- list()
        process <- list(geneset=geneset$name)
        
        prev.run <- collection.exists(mongo,db, dataset=collection[["dataset"]], dataType="edges",source=collection[["source"]],
                                      processName=paste(geneset$name, "mut01-cnv", sep="-"))
        if(prev.run){
          print("Skipping.")
          next()
        }
        
        
        if(length(mut01_colls)>0){
          mut01_coll <- mut01_colls[[1]]
          coll <- mongo.find.all(mongo, paste(db,mut01_coll$collection, sep="."))
          EdgeList_mut <- get.edgePairs(coll, geneset$name, edgeTypes=list("0"="1"))
          parent <- list(mut01_coll$`_id`)
          process$edgeType <- "mut01"
        }
        if(length(cnv_colls)>0){
          cnv_coll <- cnv_colls[[1]]
          coll <- mongo.find.all(mongo, paste(db,cnv_coll$collection, sep="."))
          EdgeList_cnv <- get.edgePairs(coll, geneset$name, edgeTypes=list("-2"="-2", "-1"="-1", "1"="1", "2"="2"))
          parent <- c(parent, cnv_coll$`_id`)
          process$edgeType <- c(process$edgeType, "cnv")
        }
		    processName=paste(unlist(process), collapse="-")
		    newEdges <- c(EdgeList_mut, EdgeList_cnv)
		        
		    save.edge.files(dataset=collection[["dataset"]], result=newEdges, source=collection[["source"]],
		                    parent=parent, process=process,processName=processName)				  
            
		}# for genesetName
  } #collection dataset/source type

}


#----------------------------------------------------------------------------------------------------
## must first initialize server (through shell >mongod)
mongo <- connect.to.mongo()

commands <- c("cluster", "edges")
#commands <- "cluster"

genesets <-     mongo.find.all(mongo,paste(db, "hg19_genesets_hgnc_import", sep="."), query=list())

if("cluster" %in% commands){
  # calculate patient similarity
#  molecular_manifest <- mongo.find.all(mongo, paste(db, "manifest", sep="."), 
#                                    query='{"dataType":{"$in":["cnv","mut01", "rna", "protein", "methylation"]}}')
  
  molecular_manifest <- mongo.find.all(mongo, paste(db, "manifest", sep="."), 
                                       query='{"dataset": "hnsc", "dataType":{"$in":["cnv","mut01", "rna", "protein", "methylation"]}}')
  
  run.batch.patient_similarity(molecular_manifest, scaleFactor=100000)
}

if("edges" %in% commands){
  # map edges for all patients between CNV/Mut and Geneset tables
#  molecular_manifest <- mongo.find.all(mongo, paste(db, "manifest", sep="."), 
#                                       query='{"dataType":{"$in":["cnv","mut01"]}}')
  molecular_manifest <- mongo.find.all(mongo, paste(db, "manifest", sep="."), 
                                       query='{"dataset": "hnsc", "dataType":{"$in":["cnv","mut01"]}}')
  
  
  run.batch.network_edges(molecular_manifest)
}


close.mongo(mongo)
