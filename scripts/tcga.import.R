###
#
#       This Script Executes Basic Processing On TCGA Files
#       Specifically It Types, Uppercases and In Cases Enforces Enumeration Types
#       
###


# Configuration -----------------------------------------------------------
#rm(list = ls(all = TRUE))
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
os.data.load.annotation <- function(oCollection, inputFile){
  
    mtx<- read.delim(inputFile, header=T) 

#    mtx.Data<- get.processed.mtx(mtx, dimension= c( "col"))
#    mtx <- mtx.Data$data; 
#    dimnames(mtx) <- list(mtx.Data$rownames, mtx.Data$colnames)

    insert.collection(oCollection, mtx)
    
}
# -------------------------------------------------------
### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load.molecular <- function(oCollection, inputFile, ...){
  
  mtx <- matrix();
  
  if(oCollection$dataType == "psi"){
    mtx<- read.delim(inputFile, header=F) 
    #orient mtx so row: gene, col: patient/sample
    if(all(grepl("^TCGA", mtx[-1,1]))) { mtx <- t(mtx)}
    
    mtx.Data<- get.processed.mtx(mtx, dimension= c("row", "col"))
    mtx <- mtx.Data$data; 
    dimnames(mtx) <- list(mtx.Data$rownames, mtx.Data$colnames)
    
    fields = toJSON(list(event=1,HGNC_symbol=1), auto_unbox = T)
    psi.annotation = mongo("hg19_annotation_bradleylab_exonjunctions", db=db, url=host)$find(fields=fields)
    
    ids = lapply(rownames(mtx), function(id) c(event=id, gene=psi.annotation[psi.annotation$event==id,"HGNC_symbol"]))
    names(ids)=rownames(mtx)
    result = list(ids=ids,data=mtx)
    insert.collection(oCollection, result)
    return();
    
  }
  else if(grepl("\\.RData$",inputFile)){
    mtx <- get(load(inputFile))
    if(all(grepl("^TCGA", rownames(mtx)))) { mtx <- t(mtx)}
    #colType <- "patient"; rowType <- "gene"

  } else if(grepl("\\.maf$",inputFile)){
    maf<- read.delim(inputFile, header=T)
    nonsyn.mtx <- subset(maf, Variant_Classification != "Silent")
    nonsyn.mtx[,"Tumor_Sample_Barcode"] <- gsub("\\w-\\w{3}-\\w{4}-\\w{2}$","",nonsyn.mtx[,"Tumor_Sample_Barcode"])
    
    genes.unique <- unique(nonsyn.mtx[,"Hugo_Symbol"])
    pts.unique <- unique(nonsyn.mtx[,"Tumor_Sample_Barcode"])
    
    mtx <- matrix("", nrow=length(genes.unique), ncol=length(pts.unique),
                  dimnames=list(genes.unique, pts.unique))
    for(i in 1:nrow(nonsyn.mtx)){
      gene = nonsyn.mtx[i,"Hugo_Symbol"];
      pt <- nonsyn.mtx[i,"Tumor_Sample_Barcode"]
      p.Change = nonsyn.mtx[i,"Protein_Change"]
      if(mtx[gene,pt] == "") mtx[gene,pt] = p.Change
      else mtx[gene,pt] = paste(mtx[gene,pt], p.Change, sep=";")
    }
    
  } else if(grepl("^GSE",inputFile)){
    #readLines: grep(^!, line); save metadata, tab separated key values
    #!Series_platform_id	"GPL570"
    #blank line
    #!Sample_
    #!Sample_characteristics_ch1 <sample specific descriptors> - may have multiple lines based on characteristic - "Gender:female", "Histology:Synovial sarcoma"
    #!Sample_title <sample specific descriptors>
    #!series_matrix_table_begin
    # rows: probes, cols: GSM samples
    
    #skipLines = 0
    #while(grepl("^!", line = readLines(inputFile))){
      #skipLines = skipLines +1
    #}
    #mtx = read.delim(inputFile, skip=skipLines, header=T, sep="\t")
    
    ## Read GPL file
    #read lines: grep(^#, line); column decriptors, key = value
    #Gene Symbol = description

        #skipLines = 0
    #while(grepl("^!", line = readLines(GPLFile))){
    #skipLines = skipLines +1
    #}
    #gpl = read.delim(GPLFile, skip=skipLines, header=T, sep="\t")
    
        
    #ids = lapply(rownames(mtx), function(id) c(probe=id, gene=gpl[id,"Gene.Symbol"]))
    #names(ids)=rownames(mtx)
    #result = list(ids=ids,data=mtx)
    #insert.collection(oCollection, result)
    
    #return();
    
  }else{ 
    mtx<- read.delim(inputFile, header=F) 
    #orient mtx so row: gene, col: patient/sample
    if(all(grepl("^TCGA", mtx[-1,1]))) { mtx <- t(mtx)}

    mtx.Data<- get.processed.mtx(mtx, dimension= c("row", "col"))
    mtx <- mtx.Data$data; 
    dimnames(mtx) <- list(mtx.Data$rownames, mtx.Data$colnames)
    
   }

  colnames(mtx) <- gsub("\\.", "-", colnames(mtx)); 
#  if(!all(grepl("\\-\\d\\d$",colnames(mtx)))){
#    colnames(mtx) <- paste(colnames(mtx), "01", sep="-")
#  }
  
  removers <- which(is.na(rownames(mtx)))
  if(length(removers >0))
    mtx <- mtx[-removers,]
  
  
  if(oCollection$dataType != "mut"){
    rowname <- rownames(mtx)
    mtx <- apply(mtx, 2, as.numeric)
    rownames(mtx) <- rowname
  }
  ids = lapply(rownames(mtx), function(id) c(gene=id))
  names(ids)=rownames(mtx)
  result = list(ids=ids,data=mtx)
  insert.collection(oCollection, result)
  
}
#---------------------------------------------------------
### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load.clinical.events <- function(oCollection, inputFile, ...){
  
  if(grepl("\\.RData$",inputFile)){
    origList <- get(load(inputFile))
    
    event.list <- lapply(origList, function(event){
      patientID <- gsub("\\.", "-", event$PatientID);  
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
      
      if(is.null(start)) start = NA;
      if(is.null(end)) end = NA;
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
    insert.collection(oCollection, list(eventList))
    #  return(list(eventList))
  }
  else{ print("WARNING: do not know how to translate event list yet")}
  
}
#---------------------------------------------------------
get.tcga.col.class <- function(columns){
  os.tcga.classes <- names(os.tcga.column.enumerations)
  column_type <- rep("character", length(columns))
  
  for(class.type in os.tcga.classes){
    for(colName in names(os.tcga.column.enumerations[[class.type]])){
      values <-os.tcga.column.enumerations[[class.type]][[colName]]
      matching.values <- which(columns %in% values)
      columns[matching.values ] <- colName
      column_type[ matching.values] <- class.type
    }
  }
  
  return(list(col=columns, class=column_type))
}
#---------------------------------------------------------
os.data.load.clinical.enum <- function(oCollection, inputFile, checkEnumerations=FALSE, checkClassType = "character"){

    # Columns :: Create List From Url
  header <- readLines(inputFile, n=3)
  primary <- unlist(strsplit(header[1],'\t'));
  secondary <- unlist(strsplit(header[2],'\t'));
  cde_ids <- unlist(strsplit(header[3],'\t'));
  cde_ids <- gsub("CDE_ID:", "", cde_ids)
  enum.mapping = get.tcga.col.class(primary)
  
  con.cde <- mongo("lookup_cde_tcga_enums", db=db, url=host)
  
  n.pass = sapply(1:length(cde_ids), function(i){
    if(cde_ids[i] %in% c("","NA","[Not Available]","[Not Applicable]") | is.na(cde_ids[i]) | is.null(cde_ids[i]) )return(FALSE)
    query = toJSON(list("cdeid"=cde_ids[i]), auto_unbox=T)
    cde.doc = con.cde$find(query)

    if(primary[i] %in% c("new_tumor_event_dx_days_to", 
                         "new_tumor_event_surgery","new_tumor_event_surgery_days_to_loco", 
                         "new_tumor_event_surgery_met","new_tumor_event_surgery_days_to_met", 
                         "new_tumor_event_radiation_tx","new_tumor_event_pharmaceutical_tx", 
                         "days_to_performance_status_assessment","new_neoplasm_event_type", 
                         "patient_death_reason","new_tumor_event_surgery_days_to_loco", 
                         "new_tumor_event_surgery_met","new_tumor_event_surgery_days_to_met", 
                         "new_tumor_event_pharmaceutical_tx")){
      
      stophere = "WTF"
    }
    
    if(secondary[i] == "NA"){
      stophere = "WTF"
    }
        
    if(length(cde.doc)==0){
      #query found nothing - cde not stored yet
      cde.doc <- list("cdeid" = cde_ids[i], "primary"=c(primary[i]), "secondary"=c(secondary[i]))
      cde.doc$enum = enum.mapping$col[[i]]
      cde.doc$type = enum.mapping$class[[i]]
      status = con.cde$insert(toJSON(cde.doc, auto_unbox = T), db=db, url=host)
      status$nInserted
    }else {
      cde.doc <- as.list(cde.doc)
      cde.doc[["primary"]] = unique(c(unlist(cde.doc[["primary"]]),primary[i] ))
      cde.doc[["secondary"]] = unique(c(unlist(cde.doc[["secondary"]]),secondary[i] ))
      cde.doc[["enum"]] = unique(c(unlist(cde.doc[["enum"]]),enum.mapping$col[[i]] ))
      cde.doc[["type"]] = unique(c(unlist(cde.doc[["type"]]),enum.mapping$class[[i]] ))
      update = list("$set"=cde.doc)
      status =con.cde$update(query,toJSON(update, auto_unbox = T))
      status
    }
    
  })
  
}
#---------------------------------------------------------
os.data.load.clinical <- function(oCollection, inputFile, checkEnumerations=FALSE, checkClassType = "character", ...){
  
  # Columns :: Create List From Url
  header <- readLines(inputFile, n=3)
  columns <- unlist(strsplit(header[1],'\t'));
  cde_ids <- unlist(strsplit(header[3],'\t'));
  cde_ids <- gsub("CDE_ID:", "", cde_ids)
  unMappedData <- list();
  tcga_columns <- columns
  
  if(grepl("../data/clinical/nationwidechildrens.org_clinical_patient_skcm.txt",inputFile)){
#    columns[match("submitted_tumor_site", columns)] = "skcm_tissue_site"
#    columns[match("submitted_tumor_site", columns)] = "skcm_tumor_type"
    columns[match("tumor_tissue_site", columns)] = "skcm_tissue_site"
    columns[match("tumor_tissue_site", columns)] = "skcm_tumor_type"
      }
  if(grepl("../data/clinical/nationwidechildrens.org_follow_up_v2.0_skcm.txt",inputFile)){
    columns[match("new_tumor_event_type", columns)] = "skcm_tumor_event_type"
  }
  if(grepl("../data/clinical/nationwidechildrens.org_clinical_patient_thca.txt",inputFile)){
    columns[columns=="metastatic_dx_confirmed_by_other"] = "thca_metastatic_dx_confirmed_by_other"
  }
  if(grepl("../data/clinical/nationwidechildrens.org_clinical_patient_kirp.txt",inputFile)){
    columns[columns=="tumor_type"] = "disease_subtype"
  }
  
  # if checkEnumerations - all columns will be read in and assigned 'character' class by default
  # otherwise only classes with defined enumerations will be stored in the mapped table
  if(checkEnumerations) { column_type <- rep("character", length(columns))}
#  else                  { column_type <- rep("NULL", length(columns)) }
  else                  { column_type <- rep("character", length(columns)) }
  
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
  removeDups <- c()
  if(length(columns) != length(unique(columns))){
    print(paste("Duplicated column names in:", oCollection$collection, collapse = " "))
    print(columns[duplicated(columns)])
    removeDups <- duplicated(columns)
#    stop();
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
  
  if(length(removeDups)>0) mappedTable <- mappedTable[,-removeDups]
  
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
#  mappedTable$patient_ID <- paste(mappedTable$patient_ID, "-01", sep="")
  
  insert.collection(oCollection, mappedTable)
  
#  return(list("mapped"=mappedTable, "unmapped" = unMappedData, "cde"=cbind(tcga_columns,columns,cde_ids, column_type)))
}
#---------------------------------------------------------
os.data.load.json <- function(oCollection, inputFile = inputFile){
  
  oJson<- fromJSON(inputFile, simplifyVector = F) 
  insert.collection(oCollection, oJson)
  
}
#---------------------------------------------------------
### Batch Is Used To Process Multiple TCGA Files Defined 
os.data.batch <- function(manifest, ...){

  # From Input File: dataframe of datasets, types and list of collections
  datasets <- fromJSON(manifest)
  
  resultObj <- list()
  
  #for (i in 1:nrow(datasets)){ # Loop for each file to load
  process_dataType <- function(i){
    sourceObj <- datasets[i,]
    stopifnot(all(c("dataset","source", "type","process") %in% names(sourceObj)))
    cat(sourceObj$dataset,sourceObj$source, sourceObj$type,"\n")
    
    #specific for raw data import
    stopifnot(all(c("directory", "file") %in% names(sourceObj)))
    
    inputDirectory <- sourceObj$directory
    if(!grepl("/$", inputDirectory)) inputDirectory <- paste(inputDirectory, "/", sep="")	
    inputFile <- paste(inputDirectory, sourceObj$file, sep = "")
    
    dataType <- sourceObj$type
    process <- list(type=sourceObj$process, scale=NA)
    if("tree" %in% names(sourceObj)) process$tree = sourceObj$tree
    if("barplot" %in% names(sourceObj)) process$barplot = sourceObj$barplot
    
    oCollection <- create.oCollection(dataset=sourceObj$dataset, dataType=sourceObj$type,
                                      source=sourceObj$source,processName=sourceObj$process,
                                      parent = sourceObj$parent, process = process)
    
    prev.run <- collection.exists(oCollection$collection)
    if(prev.run) return(FALSE);
    
    if(dataType %in% names(lookupList))
      do.call(lookupList[[dataType]][["data.load"]], list(oCollection, inputFile, ...))
    else
         print(paste("WARNING: data type not recognized for loading:", dataType))

    return(TRUE);
  }  # process_dataType
  
  import_commands <- c("os.data.load.molecular", "os.data.load.clinical")
  
  import_worker <- function() {
    bindToEnv(objNames=c(mongo_commands, import_commands, 'datasets'))
    function(i) {process_dataType(i) }
  }

  # Loop for each dataset/source type, get mut &/or cnv edges
  #batch_result <- parLapply(cluster_cores,1:nrow(datasets), import_worker())
  batch_result <- lapply(1:nrow(datasets), function(i){process_dataType(i)})  
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

#    if(!any(grepl("\\-\\d\\d$",data$values))){
#      data$values <- paste(data$values, "01", sep="-")
#    }
    
     return(data)
  })
  return (categories.type.list)
}
#----------------------------------------------------------------------------------------------------
add.category.fromFile <- function(file, name, col.name, dataset, type){
  
  tbl <- get(load(file))
  categories.list <- get.category.data(table=tbl, cat.col.name=col.name)
  df <- list(dataset=dataset, type=type, name=name, subtype="Core")
  df$data=categories.list
  return(df)
}
#----------------------------------------------------------------------------------------------------
os.data.load.categories <- function(datasets = c("brain")){
  
  color.categories <- list()
  type= "color"
  
  if("brain" %in% datasets){  
    
    ## Patient Colors by Diagnosis, glioma8, tumorGrade, verhaak
    color.categories <- list(
      add.category.fromFile(file='../data/categories/brain/tumorDiagnosis.RData', name="Diagnosis", col.name="diagnosis", dataset="brain", type=type) ,
      add.category.fromFile(file='../data/categories/brain/ericsEightGliomaClusters.RData', name="Glioma 8", col.name="cluster", dataset="brain", type=type) ,
      add.category.fromFile(file='../data/categories/brain/metabolicExpressionStemness.RData', name="Metabolic Expression Stemness", col.name="cluster", dataset="brain", type=type) ,
      add.category.fromFile(file='../data/categories/brain/tumorGrade.RData', name="Tumor Grade", col.name="cluster", dataset="brain", type=type) ,
      add.category.fromFile(file='../data/categories/brain/verhaakGbmClustersAugmented.RData', name="Verhaak Plus 1", col.name="cluster", dataset="brain", type=type) 
    )
    oCollection <- create.oCollection(dataset="brain", dataType=type, source="tcga", processName="import",parent=NA, process=list(type="import"))
    insert.collection(oCollection, color.categories )
    
  }
  if("brca" %in% datasets){
    categories.list <- fromJSON("../data/categories/brca/colorCategories.json", simplifyVector = FALSE)

     oCollection <- create.oCollection(dataset="brca", dataType=type, source="tcga", processName="import",parent=NA, process=list(type="import"))
     insert.collection(oCollection, categories.list )
     
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
 
  datasets <- mongo.lookup$find(toJSON(list("clinical.samplemap" = list("$exists" = 0), "disease"=list("$ne"="hg19")), auto_unbox=T))
  
  for(i in 1:nrow(datasets)){
    dataset = datasets[i,]
    ptMap <- list()
    if("molecular" %in% names(dataset)){
      print(paste("mapping sample ids for ", dataset$disease, sep=""))

      for(molColl in dataset$molecular[[1]]$collection){
        print (molColl)
      	con <- mongo(molColl, db=db, url=host)
        collection <- con$find()
        rm(con)
        ptMap <- map.sample.ids(names(collection$patients), dataset$source, ptMap)
      }

      oCollection <- create.oCollection(dataset=dataset$disease, dataType="samplemap", source=dataset$source, uniqueKeys=c(),parent=NA, process=list(type="import"))
      insert.collection(oCollection, list(ptMap) )
    }
    
  }
}
#----------------------------------------------------------------------------------------------------
barplot.set.value <- function(plots, values){
  
  return(plots)
}
#----------------------------------------------------------------------------------------------------
tree.set.size <- function(node, values) {
  
  if(is.null(node)) return(node)
  
  if(node$name %in% names(values))
    node$size = ifelse(is.na(values[[node$name]]), 0 , as.numeric(values[[node$name]]))
  
  if(length(node$children)>0){
   node$children= lapply(node$children, tree.set.size, values=values)
  }
  return(node)
}
#----------------------------------------------------------------------------------------------------
os.create.biomarker.tree <- function(oCollection, inputFile){
  
    Tree <- fromJSON(oCollection$process$tree, simplifyVector = F)
    Barplots <- fromJSON(oCollection$process$barplot, simplifyVector = F)
    
    mtx<- read.delim(inputFile, header=T) 
    mtx$patient_ID <- gsub("\\.", "-", mtx$patient_ID); 
#    if(!all(grepl("\\-\\d\\d$",mtx$patient_ID))){
#      mtx$patient_ID <- paste(mtx$patient_ID, "01", sep="-")
#    }

      ### Create biomarker tree (sunburst) with flow % values from table
      classifier = "tissuetype"
      patient_IDs <- unique(mtx$patient_ID)
      
      # for each patient (new document) {patient_ID:"", barcharts:[], <classifier>}
      result = lapply(patient_IDs, function(id){
           # for each classifier instance (new record) <classifier>: {name:"", groups:#, values:[]})
          graphs = apply(mtx[mtx$patient_ID == id,],1 , function(pt.data){
            lapply(Barplots,barplot.set.value,pt.data)
          })
          # for each classifier instance (new record) <classifier>: {name:"", size:#, children:[]})
          tree = apply(mtx[mtx$patient_ID == id,],1 , function(pt.data){
            #   create new immune tree - name by tissue type
            #   assign size values for each biomarker name (DNE: null, NA: 0)
              tree.set.size(Tree[[1]], pt.data)
          })
          names(tree) = mtx[mtx$patient_ID == id,classifier]
          return(tree)
      } )
      names(result) <- patient_IDs
      
      insert.collection(oCollection, result)
}

# Run Block  -------------------------------------------------------

#num_cores <- 1
num_cores <- detectCores() - 1
cluster_cores <- makeCluster(num_cores, type="FORK")

## must first initialize server (through shell >mongod)
mongo <- connect.to.mongo()

commands <- c("clinical", "scale", "lookup", "sample")
#commands <- c("categories", "clinical", "molecular", "scale", "lookup", "sample")
## -- molecular data now being pulled from python script import_ucsc.py
## -- brain categorical data retained here simply for full provenance

commands <- c("clinical", "scale", "lookup")
## TO DO: sample should be run once gene vs chr position collections decided

args = commandArgs(trailingOnly=TRUE)
if(length(args) != 0 )
  commands <- args

if("categories" %in% commands) 
  os.data.load.categories( datasets="brain")

## Import molecular table from downloaded folders
## Deprecated and replaced by python script for Xena UCSC import
if("molecular" %in% commands){
  os.data.batch("../manifests/os.ucsc.molecular.manifest.json")
}

# Import all clinical tables from GDC archive
if("clinical" %in% commands) 
  os.data.batch("../manifests/os.tcga.full.clinical.manifest.json",
                checkEnumerations = FALSE,
                checkClassType = "character")
                #                checkClassType = "os.class.tcgaCharacter")

# create initial collections for lookup and render documents 
if("lookup" %in% commands){
	lookup_tools <- fromJSON("../manifests/os.lookup_tools.json", simplifyVector = F)
	con <- mongo("lookup_oncoscape_tools", db=db, url=host)
	if(con$count() ==0)
	  lapply(lookup_tools, function(doc){con$insert(toJSON(doc, auto_unbox = T))})
	rm(con)
	
	render_pathways <- fromJSON("../manifests/render_pathways.json", simplifyVector = F)
	con <- mongo("render_pathways", db=db, url=host)
	if(con$count() ==0)
	  lapply(render_pathways, function(doc){con$insert(toJSON(doc, auto_unbox = T))})
	rm(con)
	
	lookup_genesets <- fromJSON("../manifests/lookup_genesets_hgnc_hg19.json", simplifyVector = F)
	con <- mongo("lookup_genesets", db=db, url=host)
	if(con$count() ==0)
	  lapply(lookup_genesets, function(doc){con$insert(toJSON(doc, auto_unbox = T))})
	rm(con)

	lookup_dataType <- fromJSON("../manifests/dataType_class.json", simplifyVector = F)
	con <- mongo("lookup_dataTypes", db=db, url=host)
	if(con$count() ==0)
	  lapply(lookup_dataType, function(doc){con$insert(toJSON(doc, auto_unbox = T))})
	rm(con)
	
#	ImmuneTree <- fromJSON("../data/categories/biomarker.tree.json", simplifyVector = F)
#	insert.collection.separate("biomarker_immune_tree", list(ImmuneTree))
}

# Reads from collection of scaled gene positions and creates separate docs
# Must be run after lookup in case genesets change: depends on lookup_genesets
if("scale" %in% commands){
  save.batch.genesets.scaled.pos(scaleFactor=100000, method="replace")
}

## Loop through all molecular tables and create doc with key: sampleID, value: patientID
## for TCGA data, simply removes sample suffix
## skips if samplemap already exists
if("sample" %in% commands){
  # create/update sample-patient mapping table
  os.batch.map.samples()
}

if("sunburst" %in% commands){
  os.data.batch("../manifests/os.uw.immune.manifest.json")
}

if("merge" %in% commands){
  datasetName = "brain"
  combine = c("lgg", "gbm")
  
  #grab dataTypes & manifest objects that are acceptable for simple merge
  con <- mongo("lookup_dataTypes", db=db, url=host)
  dataTypes_mol = con$distinct("dataType", '{"$and":[{"schema":"hugo_sample"},{"class": {"$in":["cnv_thd", "mut", "mut01"]}}]}')
  manifest_merge <- mongo.manifest$find( 
    query=toJSON(list(dataType=list("$in"=dataTypes_mol),dataset=list("$in"=combine)), auto_unbox = T))

  sapply(dataTypes_mol, function(dtype){
    print(paste("Combining ", dtype))
    lCollection = subset(manifest_merge, dataType==dtype)
    if(length(intersect(combine, lCollection$dataset)) == length(combine)){
      newCollection <- list(dataset = datasetName,
              collection = gsub(lCollection[1,"dataset"], datasetName, lCollection[1,"collection"]),
              source = lCollection[1,"source"], dataType=dtype)
      if(collection.exists(newCollection$collection)){
        print(paste(newCollection$collection, "already exists. Skipping."))
      }else{
        merge.collections(lCollection[1,], lCollection[2,], newCollection) 
      }
    }
    else{
      cat("Incorrect number of documents: ")
      print( lCollection[,c("dataset", "dataType")])
    }
  })
  
  lgg_mut_cur = mongo.manifest$find(toJSON(list(collection="tcga_lgg_mutation_curated_broad_gene_ucsc-xena"), auto_unbox = T))
  lgg_mut = mongo.manifest$find(toJSON(list(collection="tcga_lgg_mutation_broad_ucsc-xena"), auto_unbox = T))
  gbm_mut = mongo.manifest$find(toJSON(list(collection="tcga_gbm_mutation_broad_gene_ucsc-xena"), auto_unbox = T))
  
  newCollection <- list(dataset = datasetName,
                        collection = gsub(lgg_mut_cur$dataset, datasetName, lgg_mut_cur$collection),
                        source = lgg_mut_cur$source, dataType=lgg_mut_cur$dataType)
  if(collection.exists(newCollection$collection)){
    print(paste(newCollection$collection, "already exists. Skipping."))
  }else{
    merge.collections(lgg_mut_cur, gbm_mut, newCollection) 
  }
  newCollection <- list(dataset = datasetName,
                        collection = gsub(lgg_mut$dataset, datasetName, lgg_mut$collection),
                        source = lgg_mut$source, dataType=lgg_mut$dataType)
  if(collection.exists(newCollection$collection)){
    print(paste(newCollection$collection, "already exists. Skipping."))
  }else{
    merge.collections(lgg_mut, gbm_mut, newCollection) 
  }
  
  
}

stopCluster(cluster_cores)
close.mongo()
