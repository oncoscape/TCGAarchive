#rm(list = ls(all = TRUE))
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
    return(list(scores=c(), loadings=c(), eig= c() ));
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
	  return(list(scores=c(), loadings=c(), eig= c() ));
	}
	
	similaritySNV <- calcSimilarity(as.matrix(mut))
	similarityCNV <- calcSimilarity(as.matrix(cn))

	sharedSnvCnv <- intersect(rownames(similaritySNV), rownames(similarityCNV))
	simSNV <- similaritySNV[sharedSnvCnv, sharedSnvCnv]
	simCNV <- similarityCNV[sharedSnvCnv, sharedSnvCnv]

	SNV.CNV <- ((simSNV)/sum(simSNV)) + 
			   ((simCNV)/sum(simCNV))

	D <- as.dist(max(SNV.CNV) - SNV.CNV)
	if(any(dim(D)<3)){
	  print("WARNING: Distance mtx has less than 3 observations.")
	  return(list(scores=c(), loadings=c(), eig= c() ));
	}
	
	
	res <- cmdscale(D, k=3, eig=T, x.ret=T) #MDS.SNV.CNV
  
	tbl.pos <- res$points
	tbl.pos <- as.data.frame(tbl.pos)

     return(list(scores=tbl.pos, loadings=res$x, eig= res$eig ))
}
#----------------------------------------------------------------------------------------------------
calculate.pca <- function(mtx, genes=NA){
 
  if(!is.null(genes) & !all(is.na(genes)))
    mtx <- mtx[, intersect(colnames(mtx), unlist(genes)), drop=F]
  if(any(dim(mtx)<3)){
    reason = "WARNING: mtx does not match gene/patient set."
    print (reason)
    return(list(scores=NA, reason=reason));
  }
  ## ----- Subset mtx by invariant columns
  column.sums <- colSums(mtx, na.rm=TRUE)
  removers <- as.integer(which(column.sums == 0))
  removers <- c(removers, which(apply(mtx, 2, var)== 0))
  if(length(removers) > 0) {
    printf("removing %d columns", length(removers))
    mtx <- mtx[, -removers]
  } 
  if(any(dim(mtx)<3)){  
    reason="WARNING: mtx is singular.  PCA not computed"
    print(reason)
    return(list(scores=NA, reason=reason));
  }
  
  ## ----- Calculate PCA
  PCs <- tryCatch(
    prcomp(na.omit(mtx),center=T,scale=T),
    error=function(error.message){
      print("ERROR: PRCOMP!"); print(error.message)
      return(list(scores=NA, reason=as.character(error.message))); })
      
      if(is.null(PCs) | all(is.na(PCs$x))	)   return(PCs);
      
      scores <- PCs$x
      colnames(scores) <- NULL
      importance <- summary(PCs)$importance   
      propVar <- round(importance[2,] *100, digits=2)
      names(propVar) <- NULL
      
      return(list(scores=scores, variance=propVar, loadings=PCs$rotation))
   
}
#----------------------------------------------------------------------------------------------------
save.pca<- function(oCollection, genesetName=NA, scaleFactor=NA,idType=NA, ...){

  cat("-calculating pca\n")
  
  ## ----- Configuration ------
  if(is.na(genesetName)) genesetName = "All Genes"
	process <- list(calculation="prcomp", geneset= genesetName, dataType="PCA")
	process$source = oCollection$source
	process$input=oCollection$dataType
	process$scale=scaleFactor
	process$center="TRUE"; process$scaled="TRUE"
  uniqueKeys = c("source", "input", "geneset", "dataType")
	# Unique Keys for 'cluster' class:
  # source: where the data originated (eg GDC, UCSC Xena)
  # input: the dataType being processed (eg RNAseq, CNV)
  # geneset: subset of genes used in calculation
  # dataType: PCA (PCA|MDS|FA|...)
  
	## ----- Create a scaled & unscaled collection
	oCollection.pca = update.oCollection(oCollection, dataType="PCA", uniqueKeys=uniqueKeys, process=process)

	## ----- Check if unscaled PCA already stored as a collection
	prev.run <- document.exists(oCollection.pca)
	if(prev.run){  print("Skipping."); return(); }

	parent <- mongo.manifest$find(query=toJSON(oCollection, auto_unbox = T), fields='{"_id":1}')
  oCollection.pca$parent = parent
  
	## ----- Pull data from DB and store as numeric mtx with pts as rows
	coll <- mongo(oCollection$collection, db=db, url=host)$find()
	mtx <- convert.to.mtx(coll, format="as.numeric");
	mtx <- t(mtx); #pca uses pts as rows, genes as cols
	rm(coll);

	## ----- Subset mtx by genes
  genes = NA
	if(genesetName != "All Genes"){  
	  genes <- getGeneSet(genesetName)
	  if(!is.null(genes))
	  mtx <- mtx[, intersect(colnames(mtx), genes), drop=F]
	}
	if(any(dim(mtx)<3)){
	  reason <- "WARNING: mtx does not match gene/patient set."
	  print(reason)
	  insert.collection.dne(oCollection.pca, reason )
	  return();
	}
	
	res = calculate.pca(mtx, genes)

	if(is.na(res$scores)){
	  insert.collection.dne(oCollection.pca, res$reason )
	  return();
	}
	

	   ## ----- Save ----------
	   # Loadings -------------
	   loading.list <- lapply(rownames(res$loadings), function(name){ list(id=name, d=res$loadings[name,1:3])})
	   ## Scaled Scores ------
	   pc3 <- res$scores[,1:3]; 
	   colnames(pc3)<- c("x", "y", "z")
	   scores.list <- scaleSamplesToChromosomes(pc3, chrDim)
	   
	   result <- list(disease=oCollection$dataset,
	                  source = oCollection$source, 
	                  input=oCollection$dataType, 
	                  dataType="PCA",
	                  geneset=genesetName,
	                  scale=scaleFactor, 
	                  loading = idType,
	                  loadings=loading.list,
	                  score="sample",
	                  scores = scores.list,
	                  metadata = list(variance=c(res$variance[1], res$variance[2], res$variance[3])),
	   default=FALSE)
	   insert.document(oCollection.pca, list(result) )
	   

}
#----------------------------------------------------------------------------------------------------
calculate.mds.innerProduct <- function(mtx.tbl1, mtx.tbl2, genes=NA, regex = NA, threshold = NA){
  ## ----- MDS on All Combinations of CNV and MUT Tables ------
  
  cat("-calculating mds\n")

  if(!is.na(regex)){
    tbl1.samples <- grep(regex, colnames(mtx.tbl1),  value=TRUE)
    tbl2.samples <- grep(regex, colnames(mtx.tbl2),  value=TRUE)
  }else{
    tbl1.samples <- colnames(mtx.tbl1)
    tbl2.samples <- colnames(mtx.tbl2)
  }
  
  if(all(is.na(genes))){
    genes <- intersect(rownames(mtx.tbl1), rownames(mtx.tbl2))
  }else{ genes = unlist(genes) }
  
  samples <- unique(tbl1.samples, tbl2.samples)
  stopifnot(length(samples)>0)
  
  res <- calculateSampleSimilarityMatrix(mtx.tbl1, mtx.tbl2,samples=samples, genes=genes)
  sample_similarity <- res$scores
  #expects rows as genes and cols as samples
  
  if(is.null(sample_similarity) | any(dim(sample_similarity)==0)){
    reason = "WARNING: mtx does not match gene/pt set.  Less than 3 observations."
    print(reason)
    return(list(scores=NA, reason=reason));
  }
  
  # flip to match Bolouri, Holland PNAS paper layout
  sample_similarity[, 1] <- -1 * sample_similarity[, 1]
  sample_similarity[, 2] <- -1 * sample_similarity[, 2]
  sample_similarity[, 3] <- -1 * sample_similarity[, 3]
  
  if(!is.na(threshold)){
    outliers <- names(which(sample_similarity[,1]<threshold))
    sample_similarity <- sample_similarity[setdiff(rownames(sample_similarity), outliers), ]
  }
  
  result <- list(
    scores=sample_similarity,
    eig = res$eig
  )		  
  
  return(result)
}
#----------------------------------------------------------------------------------------------------
save.mds.innerProduct <- function(oCollection.1, oCollection.2, geneset=NA, scaleFactor=NA, ...){
    ## ----- MDS on All Combinations of CNV and MUT Tables ------

  if(oCollection.1$source != oCollection.2$source){
   reason = "currently not computing mds based on different sources"
    print(reason)
    return()
  }
  
  cat("-calculating mds\n")
  cat(paste(oCollection.1$collection, " ", oCollection.2$collection,"\n"))
  
  ## ----- Configuration ------
  dataType <- "MDS"
  genesetName <- geneset
  if(is.na(genesetName)) genesetName = "All Genes"
  datasetName <- oCollection.1$dataset
  source = unique(c(oCollection.1$source, oCollection.2$source))
  process <- list(calculation="mds", geneset= genesetName, dataType=dataType, source=source)
  process$input=list( oCollection.1$dataType, oCollection.2$dataType)
  process$scale=scaleFactor

  regex = "-01$"; threshold = NA;
  if(datasetName == "laml"){        regex = "-03$|-09$";
  } else if(datasetName == "luad"){ regex = "TCGA-[^1]" } # ignore samples from TCGA-17-Z###
  
  if(datasetName == "brca" | datasetName == "brain")  threshold = -1e-04
  process$regex=regex; process$threshold=threshold

  uniqueKeys = c("source", "input", "geneset", "dataType")
  
  parent.1 <- mongo.manifest$find(toJSON(list(collection=oCollection.1$collection), auto_unbox=T), fields=toJSON(list('_id'=1), auto_unbox = T))
  parent.2 <- mongo.manifest$find(toJSON(list(collection=oCollection.2$collection), auto_unbox=T), fields=toJSON(list('_id'=1), auto_unbox = T))
  
   oCollection.mds = create.oCollection(dataset=datasetName, dataType=dataType,
                                       source=source,
                                       uniqueKeys=uniqueKeys, 
                                       parent= c(parent.1, parent.2), 
                                       process=process)

  prev.run <- document.exists(oCollection.mds)
  if(prev.run){    print("Skipping."); return() }
  
  	coll1 <- mongo(oCollection.1$collection, db=db, url=host)$find()
  	coll2 <- mongo(oCollection.2$collection, db=db, url=host)$find()
  	
  	mtx.tbl1 <- convert.to.mtx(coll1, format="as.numeric");
  	mtx.tbl2 <- convert.to.mtx(coll2, format="as.numeric");
  	rm(coll1); rm(coll2);
  	
  	chrDim <- get.chromosome.dimensions(scaleFactor) 
  	
  	for(geneset in genesetnames){
  	  genesetnames <- c(NA, genesets$name)
  	  if(!is.na(geneset)){
  	    process$geneset = geneset
  	    genesetName = geneset
  	    update.oCollection(oCollection.mds, process=process)
  	    genes = getGeneSet(geneset) 
  	  }
  	  
  	  res = calculate.mds.innerproduct(mtx.tbl1, mtx.tbl2, genes=genes, regex=regex, threshold=threshold)
  	  if(is.na(res$result)){
  	    insert.collection.dne(oCollection.mds, res$reason )
  	  } else{
  	    
  	    mds.list<- lapply(rownames(res$scores), function(name) list(id=name, d=res$scores[name,1:3]))
  	    mds.list <- scaleSamplesToChromosomes(res$scores, chrDim=chrDim, dim.names=c("x", "y", "z"))
  	    
  	    result <- list(disease=oCollection.1$dataset,
  	                   source = source, 
  	                   input=process$input, 
  	                   dataType="MDS",
  	                   geneset=genesetName,
  	                   scale=scaleFactor, 
  	                   score="sample",
  	                   scores = mds.list,
  	                   metadata = list(eigenvalues=res$eig),
  	                   default=FALSE)
  	    insert.document(oCollection.mds, list(result) )
  	  }
  	}
  	
}
#----------------------------------------------------------------------------------------------------
run.batch.mds <- function(lCollection.cnv, lCollection.mut01,genesets, scaleFactor=NA, ...){

  gistic.scores <-c(-2,-1,1, 2)
  
  # Loop for each dataset
  process_mds <- function(i){
    
    oCollection.cnv <- lCollection.cnv[i,]
    schema = con$distinct("schema", toJSON(list(dataType=oCollection.cnv$dataType), auto_unbox = T)) 
    idType = strsplit(schema, "_")[[1]][1]
    
    ## MDS
      lCollection.mut01.ds <- subset(lCollection.mut01, dataset=oCollection.cnv$dataset)
      if(nrow(lCollection.mut01.ds)!=0){
      for(j in 1:nrow(lCollection.mut01.ds)){
        oCollection.mut01 = lCollection.mut01.ds[j,]
        if(oCollection.cnv$source != oCollection.mut01$source){
          print("currently not computing mds based on different sources")
          next;
        }
        
        save.mds.innerProduct(oCollection.cnv, oCollection.mut01, copyNumberValues=gistic.scores, scaleFactor=scaleFactor, idType=idType, ...)

      }}
	} # process_mds
  
  commands <- c("save.mds.innerProduct")
  
  pt.cluster_worker <- function() {
    bindToEnv(objNames=c(mongo_commands, commands,'genesets'))
    function(i) {
      process_mds(i)
    }
  }
  
  # Loop for each dataset/source type, get mut &/or cnv edges
  #batch_result <- parLapply(cluster_cores,1:nrow(lCollection.cnv), pt.cluster_worker())
  batch_result <- lapply(1:nrow(lCollection.cnv), function(i){process_mds(i)})  
  
  
}
#----------------------------------------------------------------------------------------------------
run.batch.pca <- function(lCollection, genesets, scaleFactor=100000,...){

  process_pca <- function(i){
    con = mongo("lookup_dataTypes", db=db, url=host)
    oCollection <- lCollection[i,]
    schema = con$distinct("schema", toJSON(list(dataType=oCollection$dataType), auto_unbox = T)) 
    print(paste(oCollection$collection, schema))
    idType = strsplit(schema, "_")[[1]][1]
    save.pca(oCollection, geneset = NA, scaleFactor=scaleFactor, idType=idType , ...)
    for(geneset in genesets$name){
      save.pca(oCollection, geneset = geneset, scaleFactor=scaleFactor,idType=idType, ...)
    }
  }
  #batch_result <- lapply(1:nrow(lCollection), function(i){process_pca(i)})  
  batch_result <- parLapply(cluster_cores,1:nrow(lCollection), process_pca())
  rm(con)
  
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
  oCollection.pt =   oCollection.gene = update.oCollection(oCollection, dataType = "ptdegree")
  insert.collection(oCollection.pt, node1_counts )
  
  temp <- as.list(table(sapply(result,function(edge) edge$g)))
  node2_counts <- lapply(names(temp), function(el) temp[el])
  oCollection.gene = update.oCollection(oCollection, dataType = "genedegree")
  insert.collection(oCollection.gene, node2_counts )
}
#----------------------------------------------------------------------------------------------------
get.edgePairs <- function(collection, genesetName, ...){				
  
    goi <- getGeneSet(genesetName)
 
    mtx <- convert.to.mtx(collection)
    
    ## get and save edge pairs
    edgePairs <- get.network_edges(mtx, samples=NA, genes=goi, ...)

  return(edgePairs)
}
#----------------------------------------------------------------------------------------------------
run.batch.network_edges <- function(lCollection){

  cat("-calculating edges\n")

    origin <- unique(lCollection[,c("dataset", "source")])
    # get unique dataset & source types
    
    process_edgeType <- function(i){
      
      sourceSet = origin[i,]  
      mut01_colls <- subset(lCollection, dataset==sourceSet$dataset & source==sourceSet$source & dataType== "mut01")
      cnv_colls   <- subset(lCollection, dataset==sourceSet$dataset & source==sourceSet$source & dataType== "cnv")
      
      if(nrow(mut01_colls)==0 & nrow(cnv_colls) ==0) return(FALSE);
      cat(sourceSet$dataset, "\n")		  

      edgetypes = c()
      if(nrow(mut01_colls)>0){ edgetypes = c("mut01") }
      if(nrow(cnv_colls)  >0){ edgetypes = c(edgetypes, "cnv") }
      
      for(geneset in genesets$name){
        EdgeList_mut <- EdgeList_cnv <- list()
        parent <- list()
        process <- list(geneset=geneset)
        
        oCollection.mds =create.oCollection(sourceSet$dataset, dataType="edges",sourceSet$source,
                                            processName=paste(geneset, edgetypes, sep="-"), parent=parent, process=process)
        
        prev.run <- collection.exists(oCollection.mds$collection)
        if(prev.run){ print("Skipping."); next();  }
        
        if(nrow(mut01_colls)>0){
          mut01_coll <- mut01_colls[1,]
          coll <- mongo(mut01_coll$collection, db=db, url=host)$find()
          EdgeList_mut <- get.edgePairs(coll, geneset, edgeTypes=list("0"="1"))
          
          parent <- mongo.manifest$find(toJSON(list(collection=mut01_coll$collection), auto_unbox=T), fields=toJSON(list('_id'=1), auto_unbox = T))
          oCollection.mds$parent <- list(parent)
          oCollection.mds$process$edgeType <- "mut01"
          rm(coll)
        }
        if(nrow(cnv_colls)>0){
          cnv_coll <- cnv_colls[1,]
          coll <- mongo(cnv_coll$collection,db=db, url=host)$find()
          EdgeList_cnv <- get.edgePairs(coll, geneset, edgeTypes=list("-2"="-2", "-1"="-1", "1"="1", "2"="2"))
          
          parent <- mongo.manifest$find(toJSON(list(collection=cnv_coll$collection), auto_unbox=T), fields=toJSON(list('_id'=1), auto_unbox = T))
          oCollection.mds$parent <- c(oCollection.mds$parent, parent)
          oCollection.mds$process$edgeType <- c(oCollection.mds$process$edgeType, "cnv")
          rm(coll)
        }
        oCollection.mds = update.oCollection(oCollection.mds, processName=paste(unlist(oCollection.mds$process), collapse="-"))
        newEdges <- c(EdgeList_mut, EdgeList_cnv)
        
        save.edge.files(oCollection.mds, result=newEdges)				  
        
      }# for genesetName
      return(TRUE);
    }#collection dataset/source type

    edge_commands <- c("get.edgePairs","save.edge.files")
    
    edges_worker <- function() {
      bindToEnv(objNames=c(mongo_commands, edge_commands,'genesets', 'origin'))
      function(i) {
        process_edgeType(i)
      }
    }
    
    # Loop for each dataset/source type, get mut &/or cnv edges
    batch_result <- parLapply(cluster_cores,1:nrow(origin), edges_worker())
#      batch_result <- lapply(1:nrow(origin), function(i){process_edgeType(i)})  
}

#----------------------------------------------------------------------------------------------------
## must first initialize server (through shell >mongod)
mongo <- connect.to.mongo()
genesets <-     mongo("lookup_genesets", db=db, url=host)$find("{}")
scaleFactor = 100000
#num_cores <- detectCores() - 1
num_cores <- 4
cluster_cores <- makeCluster(num_cores, type="FORK")

commands <- c("cluster", "edges")
commands <- "cluster"

#clusterExport(cluster_cores, c("genesets", "mongo"))

if("cluster" %in% commands){
  # calculate patient similarity
 
  con = mongo("lookup_dataTypes", db=db, url=host)
  
  dataTypes_pca = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class": {"$in":["expr", "cnv"]}}]}')
  manifest_pca <- mongo.manifest$find( 
                            query=toJSON(list(dataType=list("$in"=dataTypes_pca)), auto_unbox = T))
#  manifest_pca <- subset(manifest_pca, dataset %in% c("brca", "brain", "luad", "lusc", "prad", "hnsc", "lung", "gbm", "lgg"))
  chrDim <- get.chromosome.dimensions(scaleFactor) 
  run.batch.pca(manifest_pca,genesets, scaleFactor=100000, chrDim=chrDim)
  
  dataTypes_mds.cnv = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class":"cnv_thd"}]}')
  dataTypes_mds.mut01 = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class":"mut01"}]}')
  if(length(dataTypes_mds.cnv)<2){
    manifest_mds.cnv <- mongo.manifest$find( 
      query=toJSON(list(dataType=dataTypes_mds.cnv), auto_unbox = T))
  }else{
    manifest_mds.cnv <- mongo.manifest$find( 
      query=toJSON(list(dataType=list("$in"=dataTypes_mds.cnv)), auto_unbox = T))
  }
  if(length(dataTypes_mds.mut01)<2){
      manifest_mds.mut01 <- mongo.manifest$find( 
        query=toJSON(list(dataType=dataTypes_mds.mut01), auto_unbox = T))
  }else{
        manifest_mds.mut01 <- mongo.manifest$find( 
          query=toJSON(list(dataType=list("$in"=dataTypes_mds.mut01)), auto_unbox = T))
  }
#  manifest_mds.cnv <- subset(manifest_mds.cnv, dataset %in% c("brca", "brain", "luad", "lusc", "prad", "hnsc", "lung", "gbm"))
#  manifest_mds.mut01 <- subset(manifest_mds.mut01, dataset %in% c("brca", "brain", "luad", "lusc", "prad", "hnsc", "lung", "gbm"))
  run.batch.mds(manifest_mds.cnv,manifest_mds.mut01,genesets, scaleFactor=100000, chrDim=chrDim)
  
  rm(con)
}

if("edges" %in% commands){
  # map edges for all patients between CNV/Mut and Geneset tables
  molecular_manifest <- mongo.manifest$find(
#    query='{ "dataType":{"$in":["cnv","mut01"]}}')
                                query='{ "dataType":{"$in":["cnv","mut01"]}, "source":"ucsc"}')
  
  run.batch.network_edges(molecular_manifest)
}

stopCluster(cluster_cores)
close.mongo()
