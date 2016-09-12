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

  genes = genesets[genesets$name == geneset_name,"genes"]
  
  return(unlist(genes))
  # returns NULL if geneset_name not found
  
  #  match_name <- which(sapply(genesets, function(set){set$name ==geneset_name}))
#  if(length(match_name) == 0)
#    return(NA)
  
#	return(genesets[[match_name]]$genes)
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
save.pca<- function(oCollection, geneset=NA, scaleFactor=NA){

  cat("-calculating pca\n")
  
  ## ----- Configuration ------
  parent <- mongo.manifest$find(query=toJSON(oCollection, auto_unbox = T), fields='{"_id":1}')
  genesetName <- geneset
  if(is.na(genesetName)) genesetName = "All Genes"
	process <- list(calculation="prcomp", geneset= genesetName)
	process$input=oCollection$dataType
	if(oCollection$dataType %in% c("rna", "methylation"))
	  process$input=paste(oCollection$dataType, oCollection$process$type, sep="-")
	outputName <- paste(unlist(process), collapse="-")
	
	process$scale=scaleFactor
	processName <- paste(unlist(process), collapse="-")
	process$center="TRUE"; process$scaled="TRUE"
	#process <- list(process)

	oCollection.pca = oCollection
	oCollection.pca$dataType = "pcaScores"
	oCollection.pca$processName = outputName
	oCollection.pca$collection = collection.create.name(oCollection.pca)
	
	prev.run <- collection.exists(oCollection.pca$collection)
	if(prev.run){  print("Skipping."); return(); }
	
	coll <- mongo(oCollection$collection, db=db, url=host)$find()
	mtx <- convert.to.mtx(coll, format="as.numeric");
	mtx <- t(mtx); #pca uses pts as rows, genes as cols
	rm(coll);

	if(!is.na(geneset) & genesetName != "All Genes"){
	  genes <- getGeneSet(geneset)
	  if(!is.null(genes))
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

	if(any(dim(mtx)<3)){  print("WARNING: mtx is singular.  PCA not computed")
	  return();
	}
	  
	   PCs <- tryCatch(
		  prcomp(na.omit(mtx),center=T,scale=T),
		  error=function(error.message){
			 print("ERROR: PRCOMP!")
		    print(error.message)
			 return(NA);
			 })
   
	   if(all(is.na(PCs)))	   return();
	
	   scores <- PCs$x
	   colnames(scores) <- NULL
	   importance <- summary(PCs)$importance   
	   propVar <- round(importance[2,] *100, digits=2)
	   names(propVar) <- NULL

	   
	   ## ----- Save Raw Scores ------
	   scores.list <- lapply(rownames(scores), function(name){ scores[name,1:3]})
	   names(scores.list) <- rownames(scores)
	   process$scale = NA
	   result <- list(disease=oCollection$dataset,source = oCollection$source, type=oCollection$process$type, geneset=genesetName,scale=NA, pc1=propVar[1], pc2=propVar[2] ,pc3=propVar[3],data=scores.list)

	   insert.collection(oCollection.pca, list(result) )
	   
	   ## ----- Save Loadings ------
	   loadings <- PCs$rotation
	   loading.list <- lapply(rownames(loadings), function(name){ loadings[name,1:3]})
	   names(loading.list) <- rownames(loadings)
	   process$scale = NA
	   result <- list(disease=oCollection$dataset,source = oCollection$source, type=oCollection$process$type, geneset=genesetName,scale=NA, data=loading.list)
	   oCollection.loadings = update.oCollection(oCollection.pca, dataType ="pcaLoadings")
	   insert.collection(oCollection.loadings, list(result) )

     ## ----- Save Scaled Scores ------
     if(!is.na(scaleFactor)){
	     chrDim <- get.chromosome.dimensions(scaleFactor) 
	     pc3 <- scores[,1:3]; colnames(pc3) <- c("x", "y", "z")
	     scores.list <- scaleSamplesToChromosomes(pc3, chrDim)
	     #names(scores.list) <- rownames(scores)
	     process$scale = scaleFactor
	     result <- list(disease=oCollection$dataset,source=oCollection$source, type=process$input, geneset=genesetName,scale=scaleFactor, pc1=propVar[1], pc2=propVar[2] ,pc3=propVar[3],data=scores.list)
	     oCollection.pca.scaled <- update.oCollection(oCollection.pca, processName=processName, process=list(process))
	     insert.collection(oCollection.pca.scaled, list(result) )
	     
     }

}


#----------------------------------------------------------------------------------------------------
save.mds.innerProduct <- function(oCollection.1, oCollection.2, geneset=NA, scaleFactor=NA, ...){
    ## ----- MDS on All Combinations of CNV and MUT Tables ------

  if(oCollection.1$source != oCollection.2$source){
    print("currently not computing mds based on different sources")
    return()
  }
  
  cat("-calculating mds\n")
  
  ## ----- Configuration ------
  dataType <- "mds"
  genesetName <- geneset
  if(is.na(genesetName)) genesetName = "All Genes"
  datasetName <- oCollection.1$dataset
  process <- list(calculation="mds", geneset= genesetName)
  process$input=list( oCollection.1$dataType, oCollection.2$dataType)
  outputName <- paste(c(unlist(process),oCollection.1$source), collapse="-")
  parent.1 <- mongo.manifest$find(toJSON(list(collection=oCollection.1$collection), auto_unbox=T), fields=toJSON(list('_id'=1), auto_unbox = T))
  parent.2 <- mongo.manifest$find(toJSON(list(collection=oCollection.2$collection), auto_unbox=T), fields=toJSON(list('_id'=1), auto_unbox = T))
  
   oCollection.mds = create.oCollection(dataset=datasetName, dataType=dataType,
                                       source=c(oCollection.1$source, oCollection.2$source),
                                       processName=outputName, 
                                       parent= c(parent.1, parent.2), 
                                       process=process)
  
  process$scale=scaleFactor
  processName <- paste(c(unlist(process),oCollection.1$source), collapse="-")
  oCollection.mds.scaled <- update.oCollection(oCollection.mds, processName=processName,process=list(process))
  
  prev.run <- collection.exists(oCollection.mds$collection)
  if(prev.run){    print("Skipping."); return() }
  
	regex = "-01$"; threshold = NA;
	if(datasetName == "laml"){        regex = "-03$|-09$";
	} else if(datasetName == "luad"){ regex = "TCGA-(17)^-\\d{4}-01$" }

	if(datasetName == "brca" | datasetName == "brain")  threshold = -1e-04
	process$regex=regex; process$threshold=threshold
	oCollection.mds.scaled = update.oCollection(oCollection.mds.scaled, process=process)
	process$scale=NA
	oCollection.mds        = update.oCollection(oCollection.mds,        process=process)
	
  	coll1 <- mongo(oCollection.1$collection, db=db, url=host)$find()
  	coll2 <- mongo(oCollection.2$collection, db=db, url=host)$find()
  	
		mtx.tbl1 <- convert.to.mtx(coll1, format="as.numeric");
		mtx.tbl2 <- convert.to.mtx(coll2, format="as.numeric");
		rm(coll1); rm(coll2);
		
		tbl1.samples <- grep(regex, colnames(mtx.tbl1),  value=TRUE)
		tbl2.samples <- grep(regex, colnames(mtx.tbl2),  value=TRUE)
	
		if(is.na(geneset)){
		       genes <- intersect(rownames(mtx.tbl1), rownames(mtx.tbl2))
		}else{ genes = getGeneSet(geneset) }
		
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

		  mds.list<- lapply(rownames(sample_similarity), function(name) list(x=sample_similarity[name,"x"], y=sample_similarity[name, "y"]))
		  names(mds.list) <- rownames(sample_similarity)

		  result <- list(type="cluster", dataset=oCollection.1$dataset, name=outputName, scale=NA, data=mds.list)
			insert.collection(oCollection.mds, list(result) )

			if(!is.na(scaleFactor)){
			  chrDim <- get.chromosome.dimensions(scaleFactor) 
			  mds.list <- scaleSamplesToChromosomes(sample_similarity, chrDim, dim.names=c("x", "y"))
			  result <- list(type="cluster", dataset=oCollection.1$dataset, name=outputName, scale=scaleFactor, data=mds.list)
			  insert.collection(oCollection.mds.scaled, list(result) )
			}			
}


#----------------------------------------------------------------------------------------------------
run.batch.patient_similarity <- function(lCollection, scaleFactor=NA){

  gistic.scores <-c(-2,-1,1, 2)
  
  # Loop for each dataset
  for (i in 1:nrow(lCollection)){
    oCollection <- lCollection[i,]
    #oCollection = create.oCollection(dataset=collection$dataset, dataType, source, processName, parent, process)
    ## MDS
    if(oCollection$dataType =="cnv"){
      lCollection.mut01 <- mongo.manifest$find( 
                     query=toJSON(list(dataset=oCollection$dataset, dataType="mut01"), auto_unbox=T))
      if(nrow(lCollection.mut01)!=0){
      for(j in 1:nrow(lCollection.mut01)){
        oCollection.mut01 = lCollection.mut01[j,]
        if(oCollection$source != oCollection.mut01$source){
          print("currently not computing mds based on different sources")
          next;
        }
        
        save.mds.innerProduct(oCollection, oCollection.mut01, copyNumberValues=gistic.scores, geneset = NA, scaleFactor=scaleFactor)
        for(geneset in genesets$name){
          save.mds.innerProduct(oCollection, oCollection.mut01, copyNumberValues=gistic.scores, geneset = geneset, scaleFactor=scaleFactor)
        }
        
      }}
    }
    else if(oCollection$dataType =="mut01"){
      lCollection.cnv <- mongo.manifest$find( 
                                    query=toJSON(list(dataset=oCollection$dataset, dataType="cnv"), auto_unbox=T))
      if(nrow(lCollection.cnv)!=0){
      for(j in 1:nrow(lCollection.cnv)){
        oCollection.cnv = lCollection.cnv[j,]
        if(oCollection$source != oCollection.cnv$source){
          print("currently not computing mds based on different sources")
          next;
        }
        
        save.mds.innerProduct(oCollection.cnv, oCollection, copyNumberValues=gistic.scores, geneset = NA, scaleFactor=scaleFactor)
        for(geneset in genesets$name){
          save.mds.innerProduct(oCollection.cnv,oCollection,  copyNumberValues=gistic.scores, geneset = geneset, scaleFactor=scaleFactor)
        }
      }}
    }
    
    ## PCA
      save.pca(oCollection, geneset = NA, scaleFactor=scaleFactor)
      for(geneset in genesets$name){
        save.pca(oCollection, geneset = geneset, scaleFactor=scaleFactor)
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
save.edge.files <- function(oCollection, result){

  insert.collection(oCollection, result )
  
  temp <- as.list(table(sapply(result,function(edge) edge$p)))
  node1_counts <- lapply(names(temp), function(el) temp[el])
  oCollection.pt =   oCollection.gene = update.oCollection(oCollection, dataType = "ptDegree")
  insert.collection(oCollection.pt, node1_counts )
  
  temp <- as.list(table(sapply(result,function(edge) edge$g)))
  node2_counts <- lapply(names(temp), function(el) temp[el])
  oCollection.gene = update.oCollection(oCollection, dataType = "geneDegree")
  insert.collection(oCollection.gene, node2_counts )
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
run.batch.network_edges <- function(lCollection){

  cat("-calculating edges\n")

    dataType <- "network"

    origin <- lapply(lCollection , function(oCollection){
      c(dataset = oCollection$dataset, source = oCollection$source)
    })
    origin <- unique(origin)
    # get unique dataset & source types
    
    # Loop for each dataset/source type, get mut &/or cnv edges
    for (sourceSet in origin){
            
		  is.mut01 <- sapply(lCollection, function(oCollection){oCollection$dataset== sourceSet[["dataset"]] &
		                                                   oCollection$source == sourceSet[["source"]] &
		                                                   oCollection$dataType=="mut01"})
		  mut01_colls <- lCollection[is.mut01]
      is.cnv <- sapply(lCollection, function(oCollection){oCollection$dataset== sourceSet[["dataset"]] &
                                                          oCollection$source == sourceSet[["source"]] &
                                                       oCollection$dataType=="cnv"})
      cnv_colls <- lCollection[is.cnv]
      
		  if(length(mut01_colls)==0 & length(cnv_colls) ==0) next;
		  cat(sourceSet[["dataset"]], "\n")		  
		  
      for(geneset in genesets){
        EdgeList_mut <- EdgeList_cnv <- list()
        parent <- list()
        process <- list(geneset=geneset$name)
        
        oCollection.mds =create.oCollection(sourceSet$dataset, dataType="edges",sourceSet$source,
                                            processName=paste(geneset$name, "mut01-cnv", sep="-"), parent=parent, process=process)
        
        prev.run <- collection.exists(oCollection.mds$collection)
        if(prev.run){ print("Skipping."); next();  }
        
        if(length(mut01_colls)>0){
          mut01_coll <- mut01_colls[[1]]
          coll <- mongo(mut01_coll$collection, db=db, url=host)$find()
          EdgeList_mut <- get.edgePairs(coll, geneset$name, edgeTypes=list("0"="1"))
          oCollection.mds$parent <- list(mut01_coll$`_id`)
          oCollection.mds$process$edgeType <- "mut01"
        }
        if(length(cnv_colls)>0){
          cnv_coll <- cnv_colls[[1]]
          coll <- mongo.find.all(mongo, paste(db,cnv_coll$collection, sep="."))
          EdgeList_cnv <- get.edgePairs(coll, geneset$name, edgeTypes=list("-2"="-2", "-1"="-1", "1"="1", "2"="2"))
          oCollection.mds$parent <- c(oCollection.mds$parent, cnv_coll$`_id`)
          oCollection.mds$process$edgeType <- c(oCollection.mds$process$edgeType, "cnv")
        }
		    oCollection.mds = update.oCollection(oCollection.mds, processName=paste(unlist(process), collapse="-"))
		    newEdges <- c(EdgeList_mut, EdgeList_cnv)
		        
		    save.edge.files(oCollection.mds, result=newEdges)				  
            
		}# for genesetName
  } #collection dataset/source type

}


#----------------------------------------------------------------------------------------------------
## must first initialize server (through shell >mongod)
mongo <- connect.to.mongo()

commands <- c("cluster", "edges")
#commands <- "cluster"

genesets <-     mongo("hg19_genesets_hgnc_import", db=db, url=host)$find("{}")

if("cluster" %in% commands){
  # calculate patient similarity
  molecular_manifest <- mongo.manifest$find( 
                            query='{ "dataType":{"$in":["cnv","mut01", "rna", "protein", "methylation"]}}')
  
  run.batch.patient_similarity(molecular_manifest, scaleFactor=100000)
}

if("edges" %in% commands){
  # map edges for all patients between CNV/Mut and Geneset tables
  molecular_manifest <- mongo.manifest$find(
                            query='{ "dataType":{"$in":["cnv","mut01"]}}')
  
  run.batch.network_edges(molecular_manifest)
}


close.mongo(mongo)
