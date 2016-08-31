###
#
#       This Script Executes Basic Processing On TCGA Files
#       Specifically It Types, Uppercases and In Cases Enforces Enumeration Types
#       
###


# Configuration -----------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)

source("common.R")
source("os.tcga.mappings.R")

# -------------------------------------------------------
# aggregate list of unmapped data & cde id mapping
unmapped.List <- list()
cde.df <- data.frame()

# Data Processing Functions :: [Map, Clean, Filter]  -------------------------------------------------------
### Takes matrix, returns list of row names, col names, and data with NA labels removed from mtx
get.processed.mtx <- function(mtx, dimension){
  if("row" %in% dimension){
    noName_row <- which(is.na(mtx[1,]))
    if(length(noName_row) > 0)
      mtx <- mtx[-noName_row,]
    
    rownames <- mtx[-1,1]
    mtx <- as.matrix(mtx[,-1])
  } 
  if("col" %in% dimension){
    noName_col <- which(is.na(mtx[,1]))
    if(length(noName_col) > 0)
      mtx <- mtx[,-noName_col]
    
    colnames <- mtx[1,]
    mtx <- as.matrix(mtx[-1,])
  }
  
  return(list(rownames=rownames, colnames=colnames, data=mtx))
}
# IO Utility Functions :: [Batch, Load, Save]  -------------------------------------------------------
# -------------------------------------------------------

### Load Annotation
os.data.load.annotation <- function(inputFile){
  
  mtx <- matrix();
  
    mtx<- read.delim(inputFile, header=F) 

    mtx.Data<- get.processed.mtx(mtx, dimension= c("row", "col"))
    mtx <- mtx.Data$data; 
    dimnames(mtx) <- list(mtx.Data$rownames, mtx.Data$colnames)

    data.list <- lapply(rownames(mtx), function(idName){
        list(id=idName, data = mtx[idName,])
      })
  return(data.list)
}


# -------------------------------------------------------
### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load.molecular <- function(inputFile, type){
  
  mtx <- matrix();
  
  if(grepl("\\.RData$",inputFile)){
    mtx <- get(load(inputFile))
    if(all(grepl("^TCGA", rownames(mtx)))) { mtx <- t(mtx)}
    colType <- "patient"; rowType <- "gene"
    colnames(mtx) <- gsub("\\.", "-", colnames(mtx)); 
    
    if(!grepl("\\-\\d\\d$",colnames(mtx))){
      colnames(mtx) <- paste(colnames(mtx), "01", sep="-")
    }
    

    if(type != "mut"){ 
      rowname <- rownames(mtx)
      mtx <- apply(mtx, 2, as.numeric)
      rownames(mtx) <- rowname
    }
    
      data.list <- lapply(rownames(mtx), function(geneName){
        list(gene=geneName, min=min(mtx[geneName,]), max=max(mtx[geneName,]), patients = as.list(mtx[geneName,]))
      })
    
 
  } else{ 
    mtx<- read.delim(inputFile, header=F) 
    #orient mtx so row: gene, col: patient/sample
    if(all(grepl("^TCGA", mtx[-1,1]))) { mtx <- t(mtx)}
    #colType <- "patient"; rowType <- "gene"
    
    mtx.Data<- get.processed.mtx(mtx, dimension= c("row", "col"))
    mtx <- mtx.Data$data; 
    dimnames(mtx) <- list(mtx.Data$rownames, mtx.Data$colnames)
    colnames(mtx) <- gsub("\\.", "-", colnames(mtx)); 
    
    if(!all(grepl("\\-\\d\\d$",colnames(mtx)))){
      colnames(mtx) <- paste(colnames(mtx), "01", sep="-")
    }
    
    removers <- which(is.na(rownames(mtx)))
    if(length(removers >0))
      mtx <- mtx[-removers,]
    
    if(type != "mut"){
      rowname <- rownames(mtx)
      mtx <- apply(mtx, 2, as.numeric)
      rownames(mtx) <- rowname
    }
    
    if(type == "facs"){
      data.list <- lapply(colnames(mtx), function(ptName){
        list(patient=ptName, markers = mtx[,ptName])
      }) 
    } else{
      data.list <- lapply(rownames(mtx), function(geneName){
        list(gene=geneName, min=min(mtx[geneName,]), max=max(mtx[geneName,]), patients = as.list(mtx[geneName,]))
      })
    }
    
  }
  return(data.list)
}

#---------------------------------------------------------
### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load.clinical.events <- function(inputFile){
  
  if(grepl("\\.RData$",inputFile)){
    origList <- get(load(inputFile))
    
    event.list <- lapply(origList, function(event){
      patientID <- gsub("\\.", "-", event$PatientID);  
      if(!grepl("\\-\\d\\d$",patientID)){
        patientID <- paste(patientID, "01", sep="-")
      } 
      name <- event$Name
      
      if(name %in% c("Birth", "Diagnosis", "Status", "Progression", "Procedure", "Encounter", "Pathology", "Absent")){
        start <- end <- event$Fields$date
      } else if(name %in% c("Drug", "Radiation")){
        start <- event$Fields$date[1]
        end   <- event$Fields$date[2]
      }else if(name %in% c("Background", "Tests")){
        start <- end <- NA 
      }
      
      data <- event$Fields
      data$date <- NULL
      
      list(patientID=patientID, name=name, start=start, end=end, data=data)
    })
    
    eventList <- list()
    for(event in event.list){
      id <- event$patientID
      event$patientID <- NULL
      if(id %in% names(eventList)){
        eventList[[id]] <- c(eventList[[id]], list(event))
      } else{
        eventList[[id]] <- list(event)
      }
    }
      return(list(eventList))
  }
  else{ print("WARNING: do not know how to translate event list yet")}
  
}

#---------------------------------------------------------
os.data.load.clinical <- function(inputFile, checkEnumerations=FALSE, checkClassType = "character"){
  
  # Columns :: Create List From Url
  header <- readLines(inputFile, n=3)
  columns <- unlist(strsplit(header[1],'\t'));
  cde_ids <- unlist(strsplit(header[3],'\t'));
  cde_ids <- gsub("CDE_ID:", "", cde_ids)
  unMappedData <- list();
  tcga_columns <- columns
  
  if(grepl("../archive/clinical/nationwidechildrens.org_clinical_patient_skcm.txt",inputFile)){
    columns[match("submitted_tumor_site", columns)] = "skcm_tissue_site"
    columns[match("submitted_tumor_site", columns)] = "skcm_tumor_type"
  }
  if(grepl("../archive/clinical/nationwidechildrens.org_follow_up_v2.0_skcm.txt",inputFile)){
    columns[match("new_tumor_event_type", columns)] = "skcm_tumor_event_type"
  }
  if(grepl("../archive/clinical/nationwidechildrens.org_clinical_patient_thca.txt",inputFile)){
    columns[columns=="metastatic_dx_confirmed_by_other"] = "thca_metastatic_dx_confirmed_by_other"
  }
  if(grepl("../archive/clinical/nationwidechildrens.org_clinical_patient_kirp.txt",inputFile)){
    columns[columns=="tumor_type"] = "disease_subtype"
  }
  
  # if checkEnumerations - all columns will be read in and assigned 'character' class by default
  # otherwise only classes with defined enumerations will be stored in the mapped table
  if(checkEnumerations) { column_type <- rep("character", length(columns))}
  else                  { column_type <- rep("NULL", length(columns)) }
  
  # assign class types for recognized columns
  #   for each enumerated class type, 
  #     rename matching column to mapped name and assign appropriate type
  os.tcga.classes <- names(os.tcga.column.enumerations)
  for(class.type in os.tcga.classes){
    for(colName in names(os.tcga.column.enumerations[[class.type]])){
      values <-os.tcga.column.enumerations[[class.type]][[colName]]
      matching.values <- which(columns %in% values)
      columns[matching.values ] <- colName
      column_type[ matching.values] <- class.type
    }
  }
  
  # Table :: Read Table From URL
  mappedTable<-read.delim(inputFile,
                          header = FALSE, 
                          skip = 3,
                          dec = ".", 
                          sep = "\t",
                          strip.white = TRUE,
                          check.names=FALSE,
                          numerals = "warn.loss",
                          col.names = columns,
                          colClasses = column_type
  );
  
  if(checkEnumerations) {
    
    # Grab columns matching class type and remove those within the ignore list
    headerWithData <- columns[column_type == checkClassType]
    ignoreCols <- which(headerWithData %in% os.tcga.ignore.columns)
    if(length(ignoreCols > 0))       headerWithData <- headerWithData[- ignoreCols ]
    if(length(headerWithData) == 0)  return(list(mapped=mappedTable, unmapped=unMappedData, "cde"=cbind(tcga_columns,columns,cde_ids, column_type)));
    
    # Discard columns where all values are NA
    DataIndicator <- sapply(headerWithData, function(colName){!all(toupper(mappedTable[,colName]) %in% os.enum.na)})
    headerWithData <- headerWithData[DataIndicator]
    if(length(headerWithData) == 0) return(list(mapped=mappedTable, unmapped=unMappedData, "cde"=cbind(tcga_columns,columns,cde_ids, column_type)));
    
    # Print list of unique values for each column
    unMappedData <- lapply(headerWithData, function(colName){ unique(toupper(mappedTable[,colName]))})
    names(unMappedData) <- headerWithData
    print("---Unused columns")
    print(unMappedData)
  }
  
  mappedTable$patient_ID <- gsub("\\.", "\\-", mappedTable$patient_ID)
  mappedTable$patient_ID <- paste(mappedTable$patient_ID, "-01", sep="")
  
  mappedList <- lapply(rownames(mappedTable), function(rowID){
    mappedTable[rowID,]
  })
  
  return(list("mapped"=mappedList, "unmapped" = unMappedData, "cde"=cbind(tcga_columns,columns,cde_ids, column_type)))
}
#---------------------------------------------------------
os.data.load.genome <- function( inputFile = inputFile){
  
  genesets<- fromJSON(inputFile) 
  
  geneset.list <- apply(genesets, 1, function(row){ list(name=row[["name"]],genes=row[["genes"]])})
  
  return(geneset.list)
  
}
#---------------------------------------------------------
### Batch Is Used To Process Multiple TCGA Files Defined 
os.data.batch <- function(manifest, ...){

  # From Input File: dataframe of datasets, types and list of collections
  datasets <- fromJSON(manifest)
  resultObj <- list()
  
  # Loop for each file to load
  for (i in 1:nrow(datasets)){
    process <- list(type="import", scale=NA)
    processName = "import"

    sourceObj <- datasets[i,]
    stopifnot(all(c("dataset","source", "type","process") %in% names(sourceObj)))
    cat(sourceObj$dataset,sourceObj$source, sourceObj$type,"\n")
    
    prev.run <- collection.exists(mongo,db, dataset=sourceObj$dataset, dataType=sourceObj$type,
                                  source=sourceObj$source,processName=sourceObj$process)
    if(prev.run){
      print("Skipping.")
      next;
    }
    
    #specific for raw data import
    stopifnot(all(c("directory", "file") %in% names(sourceObj)))
    
    inputDirectory <- sourceObj$directory
    if(!grepl("/$", inputDirectory)) inputDirectory <- paste(inputDirectory, "/", sep="")	
    inputFile <- paste(inputDirectory, sourceObj$file, sep = "")
    
    dataType <- sourceObj$type
    #			resultObj <- list(dataset = sourceObj$dataset, type = dataType)
    
    if(dataType %in%  c("cnv","mut01", "mut", "rna", "protein", "methylation", "facs", "psi")){
      # Load Data Frame - map and filter by named columns
      resultObj <- os.data.load.molecular( inputFile = inputFile, type=dataType)
      process$type <- sourceObj$process
      
    }
    else if(dataType %in% c("annotation")){
      resultObj <- os.data.load.annotation(inputFile=inputFile)
    }
    else if(dataType %in%  c("patient", "drug", "radiation", "followUp-v1p0","followUp-v1p5", "followUp-v2p1", "followUp-v4p0","followUp-v4p8","followUp-v4p4", "newTumor", "newTumor-followUp-v4p0","newTumor-followUp-v4p4","newTumor-followUp-v4p8", "otherMalignancy-v4p0")){
      # Load Data Frame - map and filter by named columns
      result <- os.data.load.clinical( inputFile = inputFile, ...)
      resultObj <- result$mapped
      #				resultObj$cde <- list(result$cde)
      
    }else if(dataType %in%  c("events")){
      resultObj <- os.data.load.clinical.events( inputFile = inputFile)
    } else if(dataType %in%  c("genes", "chromosome", "centromere", "genesets")){
      resultObj <- os.data.load.genome( inputFile = inputFile)
    }else {
      print(paste("WARNING: data type not recognized:", dataType, sep=" "))
      next;
    }
    
    parent <-  NA
    
    save.collection(mongo,db, dataset=sourceObj$dataset, dataType=dataType, source=sourceObj$source,
                    result=resultObj,parent=parent, process=process,processName=sourceObj$process)
  }  # dataset
  return()
}

#----------------------------------------------------------------------------------------------------
get.category.data<- function(name, table, cat.col.name, color.col.name= "color"){
  
  table[,cat.col.name] <- as.character(table[,cat.col.name])
  NoCategory <- is.na(table[,cat.col.name])
  table[NoCategory,cat.col.name] <- "NA"
  table[NoCategory,color.col.name] <- "grey"
  
  catNames <- unique(table[,cat.col.name])
  categories.type.list <- lapply(catNames, function(cat.name){
    matches <- which(table[,cat.col.name]==cat.name)
    color<- unique(table[matches,color.col.name])
    data <- list(	name=cat.name, color=color)
    data$values = gsub("\\.", "\\-", rownames(table)[matches])

    if(!grepl("\\-\\d\\d$",data$values)){
      data$values <- paste(data$values, "01", sep="-")
    }
    
     return(data)
  })
  return (categories.type.list)
}
#----------------------------------------------------------------------------------------------------
add.category.fromFile <- function(file, name, col.name, dataset, type){
  
  tbl <- get(load(file))
  categories.list <- get.category.data(table=tbl, cat.col.name=col.name)
  df <- list(dataset=dataset, type=type, name=name)
  df$data=categories.list
  return(df)
}

#----------------------------------------------------------------------------------------------------
os.save.categories <- function(datasets = c("brain")){
  
  color.categories <- list()
  type= "color"
  
  if("brain" %in% datasets){  
    
    ## Patient Colors by Diagnosis, glioma8, tumorGrade, verhaak
    color.categories <- list(
      add.category.fromFile(file='../archive/categories/brain/tumorDiagnosis.RData', name="diagnosis", col.name="diagnosis", dataset="brain", type=type) ,
      add.category.fromFile(file='../archive/categories/brain/ericsEightGliomaClusters.RData', name="glioma8", col.name="cluster", dataset="brain", type=type) ,
      add.category.fromFile(file='../archive/categories/brain/metabolicExpressionStemness.RData', name="metabolicExpressionStemness", col.name="cluster", dataset="brain", type=type) ,
      add.category.fromFile(file='../archive/categories/brain/tumorGrade.RData', name="tumorGrade", col.name="cluster", dataset="brain", type=type) ,
      add.category.fromFile(file='../archive/categories/brain/verhaakGbmClustersAugmented.RData', name="verhaakPlus1", col.name="cluster", dataset="brain", type=type) 
    )
    
    save.collection(mongo,db, dataset="brain", dataType=type, source="tcga",
                    result=color.categories,parent=NA, process=list(type="import"),processName="import")
    
  }
  if("brca" %in% datasets){
    categories.list <- fromJSON("../archive/categories/brca/colorCategories.json", simplifyVector = FALSE)
#    color.categories <- apply(categories.list, 1, function(colorcat){list(dataset=colorcat$dataset, type=colorcat$type, name=colorcat$name, data=colorcat$data)})
     save.collection(mongo,db, dataset="brca", dataType=type, source="tcga",
                    result=categories.list,parent=NA, process=list(type="import"),processName="import")
    
  }
}
#----------------------------------------------------------------------------------------------------
map.sample.ids <- function(samples, source, mapping=list()){

  samples <- setdiff(samples, names(mapping))
  if(source == "TCGA"){
    patients <- as.list(gsub("-\\d\\d$", "", samples))
    names(patients) <- samples
    mapping <- c(mapping, patients)
  }
  
  return(mapping)
}
  
#----------------------------------------------------------------------------------------------------
os.batch.map.samples <- function(){
 
  datasets <- mongo.find.all(mongo, paste(db, "lookup_oncoscape_datasources", sep="."))
  
  for(dataset in datasets){
    
    ptMap <- list()
    if("molecular" %in% names(dataset)){
      print(paste("mapping sample ids for ", dataset$disease, sep=""))

      for(molColl in dataset$molecular){
        collection <- mongo.find.all(mongo, paste(db, molColl$collection, sep="."))[[1]]
        ptMap <- map.sample.ids(names(collection$patients), dataset$source, ptMap)
      }
      save.indiv.collection(mongo, db, paste(dataset$disease,dataset$source,"sample_map", sep="_"), list(ptMap))
    }
    
    
  }
     

}
# Run Block  -------------------------------------------------------

## must first initialize server (through shell >mongod)
mongo <- connect.to.mongo()

commands <- c("categories", "clinical", "molecular", "scale", "lookup", "sample")
#commands <- c("categories")
#commands <- c("molecular")
#commands <- c("scale")
commands <- "clinical"
#commands <- "lookup"
#commands <- "sample"

args = commandArgs(trailingOnly=TRUE)
if(length(args) != 0 )
  manifest <- args

if("categories" %in% commands) 
  os.save.categories( datasets=c( "brain", "brca"))

if("molecular" %in% commands) 
  os.data.batch("../manifests/os.full.molecular.manifest.json")

if("clinical" %in% commands) 
  os.data.batch("../manifests/os.tcga.full.clinical.manifest.json",
                checkEnumerations = FALSE,
                checkClassType = "os.class.tcgaCharacter")

if("scale" %in% commands){
  save.batch.genesets.scaled.pos(scaleFactor=100000)
}

if("lookup" %in% commands){
	lookup_tools <- fromJSON("../manifests/os.lookup_tools.json", simplifyVector = F)
	save.indiv.collection(mongo,db,"lookup_oncoscape_tools", lookup_tools)

	ImmuneTree <- fromJSON("../archive/categories/biomarkerTree.json", simplifyVector = F)
	save.indiv.collection(mongo,db,"biomarker_immune_tree", list(ImmuneTree))
	
}

if("sample" %in% commands){
  # create/update sample-patient mapping table
  os.batch.map.samples()
}

close.mongo(mongo)
