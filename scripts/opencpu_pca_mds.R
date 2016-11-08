library(jsonlite)
library(mongolite)

chromosomes <- c(seq(1:22), "X", "Y")
db <- "tcga"
host="mongodb://localhost"
location = "dev"

if(location == "dev"){
	user="oncoscape"
	password = Sys.getenv("dev_oncoscape_pw")
	host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")
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

#----------------------------------------------------------------------------------------------------
calculate.pca <- function(collection.name, geneset=NA, scaleFactor=NA){
 
  ## ----- Pull data from DB and store as numeric mtx with pts as rows
  coll <- mongo(collection.name, db=db, url=host)$find()
  mtx <- convert.to.mtx(coll, format="as.numeric");
  mtx <- t(mtx); #pca uses pts as rows, genes as cols
  rm(coll);
 
  if(!is.null(geneset) & !all(is.na(geneset)))
    mtx <- mtx[, intersect(colnames(mtx), unlist(geneset)), drop=F]
  if(any(dim(mtx)<3)){
    print("WARNING: mtx does not match gene/patient set.")
    return();
  }
  ## ----- Subset mtx by invariant columns
  column.sums <- colSums(mtx, na.rm=TRUE)
  removers <- as.integer(which(column.sums == 0))
  removers <- c(removers, which(apply(mtx, 2, var)== 0))
  if(length(removers) > 0) {
    printf("removing %d columns", length(removers))
    mtx <- mtx[, -removers]
  } 
  if(any(dim(mtx)<3)){  print("WARNING: mtx is singular.  PCA not computed")
    return();
  }
  
  ## ----- Calculate PCA
  PCs <- tryCatch(
    prcomp(na.omit(mtx),center=T,scale=T),
    error=function(error.message){
      print("ERROR: PRCOMP!"); print(error.message)
      return(NA); })
  
  if(all(is.na(PCs)))	   return();
  
  scores <- PCs$x
  colnames(scores) <- NULL
  importance <- summary(PCs)$importance   
  propVar <- round(importance[2,] *100, digits=2)
  names(propVar) <- NULL
  
  ## ----- Store Loadings ------
  loadings <- PCs$rotation
  loading.list <- lapply(rownames(loadings), function(name){ loadings[name,1:3]})
  names(loading.list) <- rownames(loadings)
  result <- list(pc1=propVar[1], pc2=propVar[2] ,pc3=propVar[3],loadings=loading.list)

  ## ----- Store Scaled Scores ------
  if(!is.na(scaleFactor)){
    chrDim <- get.chromosome.dimensions(scaleFactor) 
    pc3 <- scores[,1:3]; colnames(pc3) <- c("x", "y", "z")
    scores.list <- scaleSamplesToChromosomes(pc3, chrDim)
    #names(scores.list) <- rownames(scores)
    result$scores <- scores.list
  }else{
    scores.list <- lapply(rownames(scores), function(name){ scores[name,1:3]})
    names(scores.list) <- rownames(scores)
    result$scores <- scores.list
    
  }
  
  result.json <- toJSON(result, auto_unbox = T)
  return(result.json)
   
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

     return(tbl.pos)
}

#----------------------------------------------------------------------------------------------------

calculate.mds.innerProduct <- function(collection.name.1, collection.name.2, geneset=NA, scaleFactor=NA, regex = NA, threshold = NA){
  ## ----- MDS on All Combinations of CNV and MUT Tables ------
  
  cat("-calculating mds\n")
  
  ## ----- Configuration ------
  coll1 <- mongo(collection.name.1, db=db, url=host)$find()
  coll2 <- mongo(collection.name.2, db=db, url=host)$find()
  
  mtx.tbl1 <- convert.to.mtx(coll1, format="as.numeric");
  mtx.tbl2 <- convert.to.mtx(coll2, format="as.numeric");
  rm(coll1); rm(coll2);
  
  if(!is.na(regex)){
    tbl1.samples <- grep(regex, colnames(mtx.tbl1),  value=TRUE)
    tbl2.samples <- grep(regex, colnames(mtx.tbl2),  value=TRUE)
  }else{
    tbl1.samples <- colnames(mtx.tbl1)
    tbl2.samples <- colnames(mtx.tbl2)
  }
  
  if(all(is.na(geneset))){
    genes <- intersect(rownames(mtx.tbl1), rownames(mtx.tbl2))
  }else{ genes = unlist(geneset) }
  
  samples <- unique(tbl1.samples, tbl2.samples)
  sample_similarity <- calculateSampleSimilarityMatrix(mtx.tbl1, mtx.tbl2,samples=samples, genes=genes)
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
 
  if(!is.na(scaleFactor)){
    chrDim <- get.chromosome.dimensions(scaleFactor) 
    mds.list <- scaleSamplesToChromosomes(sample_similarity, chrDim, dim.names=c("x", "y"))
   }else{
    mds.list<- lapply(rownames(sample_similarity), function(name) list(x=sample_similarity[name,"x"], y=sample_similarity[name, "y"]))
    names(mds.list) <- rownames(sample_similarity)
  }		
  
  result.json <- toJSON(mds.list, auto_unbox = T)
  return(result.json)
}
