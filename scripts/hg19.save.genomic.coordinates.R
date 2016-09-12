
# Configuration -----------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

source("common.R")
library(org.Hs.eg.db)

cytoband_url <- "http://hgdownload.cse.ucsc.edu/goldenPath/hg38/database/cytoBand.txt.gz"
chromosomes <- c(seq(1:22), "X", "Y")
date <- as.character(Sys.Date())
scaleFactor <- 100000


#----------------------------------------------------------------------------------------------------
getChromosomeLengths <- function(){
	return( org.Hs.egCHRLENGTHS )
}
#----------------------------------------------------------------------------------------------------
getEntrezSymbolMap <- function(){
	symbolMap <- org.Hs.egSYMBOL
	mapped_genes <- mappedkeys(symbolMap)
	
	return(as.list(symbolMap[mapped_genes]) )
	
}#----------------------------------------------------------------------------------------------------
getGenePositions_Entrez <- function(){

	genePos <- org.Hs.egCHRLOC
	# Get the entrez gene identifiers that are mapped to chromosome locations

	mapped_genes <- mappedkeys(genePos)
	return( as.list(genePos[mapped_genes]) )
}
#----------------------------------------------------------------------------------------------------
getGenePositions_Symbol <- function(){
	EntrezGenePos <- getGenePositions_Entrez()
	  # list of gene start positions, with entrez ID as name.  
	  # Multiple positions reported as named integer vector (name=chromosome)
	  # Locations measured as the number of base pairs from the p (5' end of the sense strand) to q (3' end of the sense strand) arms. 
	  # Locations on antisense strand have a leading "-" sign (e. g. -1234567)
	
	EntrezSymbolMap <- getEntrezSymbolMap()
	
	noSymbol<- which(sapply(EntrezSymbolMap, function(gene){is.na(gene)}))
	stopifnot(length(noSymbol) == 0)
		# all EntrezGene IDs should have symbol
	stopifnot(length(setdiff(names(EntrezGenePos), names(EntrezSymbolMap))) ==0)

	names(EntrezGenePos) <- sapply(names(EntrezGenePos), function(entrezID) { EntrezSymbolMap[[entrezID]] })
		# Set EntrezGenePos names to gene symbol using EntrezSymbolMap
	
	return (EntrezGenePos)
}

#----------------------------------------------------------------------------------------------------

saveChromosome_Coordinates <- function(){

	chrLengths <- getChromosomeLengths()

	chrLength.list<-as.list(chrLengths)
	names(chrLength.list) <- names(chrLengths)
	
		result = list(dataset="hg19", type="chromosome", process="length", data=chrLength.list)

	oCollection <- create.oCollection(dataset="hg19", dataType="chromosome", source="orgHs", processName="length",parent=NA, process=list(type="length", scale=NA))
	insert.collection(oCollection, list(result) )
	
}	
#----------------------------------------------------------------------------------------------------
saveGene_Coordinates <- function(){

	genePos <- getGenePositions_Symbol()
		# list of all start locations for each gene symbol
			
	genePos_min <- lapply(genePos, function(geneLocations) { 
		geneLocations <- geneLocations[names(geneLocations) %in% chromosomes]
		if(length(geneLocations)==0) return("NULL")

		minLoc <- min(abs(geneLocations))
		chrName <- unique(names(geneLocations)[which(abs(geneLocations) == minLoc)])
		c(chrName, as.integer(minLoc))
	})
	# list with chr name & min (absolute value) chr location for each gene symbol
	
	notMapped <- which(genePos_min == "NULL")
	genePos_min[notMapped] <- NULL
		# removes gene positions that map to chromosomes outside our list (ie 1-22, X, Y)

	process = list(type=c("position", "min", "abs", "start"))
	processName = paste(unlist(process), collapse="-")
	process$scale = NA
	result = list(dataset="hg19", type="genes", process=process, data=genePos_min)

	oCollection <- create.oCollection(dataset="hg19", dataType="genes", source="orgHs", processName=processName,parent=NA, process=process)
	insert.collection(oCollection, list(result) )
	
}
#----------------------------------------------------------------------------------------------------
saveCentromere_Coordinates <- function(cytoband_url){
	
	temp <- tempfile()
	download.file(cytoband_url,temp)
	cytobands <- read.delim(gzfile(temp), header=F)
	unlink(temp)

	colnames(cytobands) <- c("chr", "start", "end", "cytoband", "other")
	cytobands$chr <- sub("chr", "", cytobands$chr)
	
	centromere <- sapply(chromosomes, function(chrName){
		chr_cyto <- subset(cytobands, chr == chrName)
		chr_cyto_p <- subset(chr_cyto, grepl("^p", cytoband))
		chr_p_end <- max(chr_cyto_p$end)
			# == chr_q_start 
		
		chr_p_end
	})
	
	df<-as.list(centromere)
	names(df) <- names(centromere)
	
	result = list(dataset="hg19", type="centromere", process="position", data=df)
	oCollection <- create.oCollection(dataset="hg19", dataType="centromere", source="orgHs", processName="position",parent=NA, process=list(type="position", scale=NA))
	insert.collection(oCollection, list(result) )
	
}

#--------------------------------------------------------------#
getChromosomeOffsets <- function(chromosomes, chrLengths, pLength, scaleFactor=1000){
  
  pLength = unlist(pLength)/scaleFactor
  chrLengths = unlist(chrLengths)/scaleFactor
  
  yCent <- max(pLength)
  yOffset <- sapply(chromosomes, function(chr) {  yCent - pLength[chr] })
  names(yOffset) <- chromosomes
  yChrLengths <- sapply(chromosomes, function(chr) { yOffset[chr] + chrLengths[chr] })
  names(yChrLengths) <- chromosomes
  
  yHeight <- max(unlist(yChrLengths))
  xWidth <- yHeight * (4/3)  # 3x4 (y,x) ratio
  numChrs <- length(chromosomes)
  chrWidth <- xWidth/numChrs
  xChrOffset <- sapply(1:numChrs, function(i) { chrWidth*i })
  
  chrCoordinates <- data.frame(name=chromosomes,length=unlist(chrLengths[chromosomes]),centromere=unlist(pLength), yOffset=unlist(yOffset), xOffset = unlist(xChrOffset))
  rownames(chrCoordinates) <- chromosomes
  
  return(list(chrCoordinates =chrCoordinates, dim=c(xWidth, yHeight)))
}
#--------------------------------------------------------------#
getChromosomePositions <- function(chromosomes, chrCoordinates){
  
  chrPos <- lapply(chromosomes, function(chr){
    offset = chrCoordinates[chr,"yOffset"]
    list(x=chrCoordinates[chr, "xOffset"], p=offset, c=offset+chrCoordinates[chr,"centromere"], q=offset+chrCoordinates[chr,"length"])
  })
  names(chrPos) <- chromosomes
  return(chrPos)
  
}


#--------------------------------------------------------------#
#creates 2 files: scaled positions of chromosomes and all genes with offsets to align centromeres
run.scale.chr.genes <- function(scaleFactor=10000){
  
  # define data objects
  
  chrLenObj  <- mongo.manifest$find(toJSON(list(dataset="hg19", dataType="chromosome", process=list(type="length", scale=NA)),auto_unbox=T), '{}')
  genePosObj <- mongo.manifest$find(toJSON(list(dataset="hg19", dataType="genes", process=list(type=c("position", "min", "abs", "start"), scale=NA)),auto_unbox=T), '{}')
  centPosObj <- mongo.manifest$find(toJSON(list(dataset="hg19", dataType="centromere",process=list(type="position", scale=NA)),auto_unbox=T), '{}')
  
  chrLengths <- mongo(chrLenObj$collection, db=db, url=host)$find()
  pLength    <- mongo(centPosObj$collection, db=db, url=host)$find()
  genePos    <- mongo(genePosObj$collection, db=db, url=host)$find()
  
  chromosomes <- c(seq(1:22), "X", "Y")
  
  ## calculate Chromosome & Gene positions with scaling
  chrSpecs <- getChromosomeOffsets(chromosomes, chrLengths$data, pLength$data, scaleFactor=scaleFactor)
  chrPos <- getChromosomePositions(chromosomes, chrSpecs$chrCoordinates)
  genePos_scaled <- scaleGenesToChromosomes(genePos$data, chrSpecs$chrCoordinates, scaleFactor=scaleFactor)
  
  ## create collections
  process <- list(scale=scaleFactor); processName <- paste(process, collapse="-")
  ## Chr Positions
  parent <- list(chrLenObj$`_id`, centPosObj$`_id`)
  result <- list(type="chromosome", scale=scaleFactor, data=chrPos)

  oCollection <- create.oCollection(chrLenObj$dataset, dataType=chrLenObj$dataType, source=chrLenObj$source, processName=processName,parent=parent, process=process)
  insert.collection(oCollection, list(result) )
  
  ## Gene Positions
  parent <- list(genePosObj$`_id`, chrLenObj$`_id`)
  result <- list(type="genes", scale=scaleFactor, data=genePos_scaled)

  oCollection <- create.oCollection(genePosObj$dataset, dataType=genePosObj$dataType, source=genePosObj$source, processName=processName,parent=parent, process=process)
  insert.collection(oCollection, list(result) )
  
}	


#----------------------------------------------------------------------------------------------------
## must first initialize server (through shell >mongod)

#mongo <- connect.to.mongo(host="oncoscape-dev-db1.sttrcancer.io:27017", username="oncoscape", password=password)
mongo <- connect.to.mongo()

saveChromosome_Coordinates()
saveGene_Coordinates()
saveCentromere_Coordinates(cytoband_url)	
	
run.scale.chr.genes(scaleFactor)
	
close.mongo()
