<<<<<<< HEAD

# Configuration -----------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

source("common.R")
library(org.Hs.eg.db)

cytoband_url <- "http://hgdownload.cse.ucsc.edu/goldenPath/hg38/database/cytoBand.txt.gz"
chromosomes <- c(seq(1:22), "X", "Y")
date <- as.character(Sys.Date())
scaleFactor <- 100000
=======
library(org.Hs.eg.db)
library(jsonlite)

#--------------------------------- make plot data -----------------------------#
directory <- "../molecular_data/hg19"
chr_file <- "chromosome_lengths_hg19"
gene_file <- "gene_symbol_min_abs_start_hg19"
cent_file <- "centromere_position_hg19"
cytoband_url <- "http://hgdownload.cse.ucsc.edu/goldenPath/hg38/database/cytoBand.txt.gz"

chromosomes <- c(seq(1:22), "X", "Y")

#----------------------------------------------------------------------------------------------------
save.json <- function(dataObj, directory, file)
{
  if(!dir.exists(directory))
    dir.create(file.path(directory), recursive=TRUE)
  
  if(!grepl("/$", directory)) directory <- paste(directory, "/", sep="")
 
  outFile = paste(directory, file, sep="")
  write(toJSON(dataObj, pretty=TRUE, digits=I(8)), file=paste(outFile,".json", sep = "") )
  
} # saveGraph

>>>>>>> develop

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
<<<<<<< HEAD
saveChromosome_Coordinates <- function(){

	chrLengths <- getChromosomeLengths()
	df<-data.frame(t(chrLengths))
	names(df) <- names(chrLengths)

	result = list(dataset="hg19", type="chromosome", process="length", data=df)
	
	save.collection(mongo,db, dataset="hg19", dataType="chromosome", source="orgHs",
	                result=list(result),parent=NA, process=list(type="length", scale=NA),processName="length")
}	
#----------------------------------------------------------------------------------------------------
saveGene_Coordinates <- function(){
=======
saveChromosome_Coordinates <- function(out_file){
	
	chrLengths <- getChromosomeLengths()
	df<-data.frame(t(chrLengths))
	names(df) <- names(chrLengths)
	save.json(df, directory, file=out_file)
}	
#----------------------------------------------------------------------------------------------------
saveGene_Coordinates <- function(out_file){
>>>>>>> develop

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

<<<<<<< HEAD
	process = list(type=c("position", "min", "abs", "start"))
	processName = paste(unlist(process), collapse="-")
	process$scale = NA
	result = list(dataset="hg19", type="genes", process=process, data=genePos_min)
	
	save.collection(mongo,db, dataset="hg19", dataType="genes", source="orgHs",
	                result=list(result),parent=NA, process=process,processName=processName)
	
}
#----------------------------------------------------------------------------------------------------
saveCentromere_Coordinates <- function(cytoband_url){
=======
	save.json(genePos_min, directory, out_file)

}
#----------------------------------------------------------------------------------------------------
saveCentromere_Coordinates <- function(cytoband_url, out_file){
>>>>>>> develop
	
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
	
	df<-data.frame(t(centromere))
	names(df) <- names(centromere)
	
<<<<<<< HEAD
	result = list(dataset="hg19", type="centromere", process="position", data=df)
	
	save.collection(mongo,db, dataset="hg19", dataType="centromere", source="orgHs",
	                result=list(result),parent=NA, process=list(type="position", scale=NA),processName="position")
	
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
    data.frame(x=chrCoordinates[chr, "xOffset"], p=offset, c=offset+chrCoordinates[chr,"centromere"], q=offset+chrCoordinates[chr,"length"])
  })
  names(chrPos) <- chromosomes
  return(chrPos)
  
}


#--------------------------------------------------------------#
#creates 2 files: scaled positions of chromosomes and all genes with offsets to align centromeres
run.scale.chr.genes <- function(scaleFactor=10000){
  
  # define data objects
  chrLenObj <- mongo.find.all(mongo, paste(db, "manifest",sep="."), list(dataset="hg19", dataType="chromosome", process=list(type="length", scale=NA)))[[1]]
  genePosObj  <- mongo.find.all(mongo, paste(db, "manifest",sep="."), list(dataset="hg19", dataType="genes", process=list(type=c("position", "min", "abs", "start"), scale=NA)))[[1]]
  centPosObj  <- mongo.find.all(mongo, paste(db, "manifest",sep="."), list(dataset="hg19", dataType="centromere",process=list(type="position", scale=NA)))[[1]]
  
  chrLengths <- mongo.find.all(mongo, paste(db,chrLenObj$collection, sep="."), list())[[1]]
  pLength    <- mongo.find.all(mongo, paste(db,centPosObj$collection, sep="."), list())[[1]]
  genePos    <- mongo.find.all(mongo, paste(db,genePosObj$collection, sep="."), list())[[1]]
  
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
  save.collection(mongo,db, dataset=chrLenObj$dataset, dataType=chrLenObj$dataType,source=chrLenObj$source, result=list(result),
                              parent=parent, process=process,processName=processName)
  ## Gene Positions
  parent <- list(genePosObj$`_id`, chrLenObj$`_id`)
  result <- list(type="geneset", scale=scaleFactor, data=genePos_scaled)
  save.collection(mongo,db, dataset=genePosObj$dataset, dataType=genePosObj$dataType,source=genePosObj$source, result=list(result),
                              parent=parent, process=process,processName=processName)
  
}	





#----------------------------------------------------------------------------------------------------
## must first initialize server (through shell >mongod)

#mongo <- connect.to.mongo(host="oncoscape-dev-db1.sttrcancer.io:27017", username="oncoscape", password=password)
mongo <- connect.to.mongo()

saveChromosome_Coordinates()
saveGene_Coordinates()
saveCentromere_Coordinates(cytoband_url)	
	
run.scale.chr.genes(scaleFactor)
	
close.mongo(mongo)

=======
	save.json(df, directory, out_file)
}
#----------------------------------------------------------------------------------------------------

	saveChromosome_Coordinates(chr_file)
	saveGene_Coordinates(gene_file)
	saveCentromere_Coordinates(cytoband_url, cent_file)	
	
>>>>>>> develop
	