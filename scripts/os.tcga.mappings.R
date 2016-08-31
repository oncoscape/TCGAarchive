# Class Definitions :: Enumerations -------------------------------------------------------

os.tcga.field.enumerations  <- fromJSON(paste("../manifests","os.tcga.field.enumerations.json" , sep="/"))
os.tcga.column.enumerations <- fromJSON(paste("../manifests","os.tcga.column.enumerations.json", sep="/"))

os.enum.na <- c("", "NA", "[NOTAVAILABLE]","[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","UKNOWN","[DISCREPANCY]",
                "NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","PENDING", "[NOT AVAILABLE]","[PENDING]",
                "[NOTAVAILABLE]","NOT SPECIFIED","[NOT AVAILABLE]|[NOT AVAILABLE]",
                "[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]",
                "[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]",
                "[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILosABLE]",
                "[NOT AVAILABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT AVAILABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]|[NOT AVAILABLE]|[NOT APPLICABLE]|[NOT APPLICABLE]","N/A")
os.enum.logical.true  <- c("TRUE","YES","1","Y")
os.enum.logical.false <- c("FALSE","NO","0","N")
os.tcga.ignore.columns <- c("bcr_patient_uuid", 
                            "bcr_drug_uuid","bcr_drug_barcode",
                            "bcr_followup_uuid","bcr_followup_barcode",
                            "bcr_radiation_uuid","bcr_radiation_barcode", 
                            "bcr_omf_uuid", "bcr_omf_barcode",
                            "informed_consent_verified", "form_completion_date", 
                            "project_code", "patient_id")


Map( function(key, value, env=parent.frame()){
  setClass(key)
  setAs("character", key, function(from){ 
    # Convert To Upper + Set NAs  
    from<-toupper(from) 
    from.na<-which(from %in% os.enum.na)
    from[from.na]<-NA    
    
    from.clean <- rep(NA, length(from))
    
    # Return Enum or NA
    standardVals <- names(os.tcga.field.enumerations[[key]])
    for(fieldName in standardVals){
      values <-os.tcga.field.enumerations[[key]][[fieldName]]
      from.clean[ which(from %in% values)] <- paste(from.clean[which(from %in% values)], fieldName, sep=";")
    }
    from.clean <- gsub("^NA;", "", from.clean)

    if(all(unlist(sapply(from.clean, function(val){strsplit(val, ";")})) %in% c(standardVals, NA)))
      return(from.clean)
    
    # Kill If Not In Enum or Na
    stop(paste(key, " not set due to: ", paste(setdiff(from.clean,c(standardVals, NA)), collapse="..."), " not belonging to ", paste(standardVals, collapse=";")))
  })
}, names(os.tcga.field.enumerations), os.tcga.field.enumerations);

# Class Definitions :: TCGA [ID | DATE | CHAR | NUM | BOOL] -------------------------------------------------------

### TCGA ID
setClass("os.class.tcgaId")
setAs("character","os.class.tcgaId", function(from) {
  as.character(str_replace_all(from,"-","." )) 
})

### TCGA Date
setClass("os.class.tcgaDate");
setAs("character","os.class.tcgaDate", function(from){
  
  # Convert Input Character Vector To Uppercase
  from<-toupper(from) 
  
  # Validate Format + Convert Day-Month to 1-1
  if ((str_length(from)==4) && !is.na(as.integer(from) ) ){
    return(as.numeric(as.POSIXct(paste(from, "-1-1", sep=""), format="%Y-%m-%d")))
    #    return(format(as.Date(paste(from, "-1-1", sep=""), "%Y-%m-%d"), "%m/%d/%Y"))
  }
  
  # Return NA If Validation Fails
  return(NA)
})

### TCGA Character
setClass("os.class.tcgaCharacter");
setAs("character","os.class.tcgaCharacter", function(from){
  
  # Convert Input Character Vector To Uppercase
  from<-toupper(from) 
  
  # Get Indexes Of Fram Where Value Is In NA
  from.na<-which(from %in% os.enum.na)
  
  # Set From Indexes Values To NA
  from[from.na]<-NA 
  
  return(from)
})

### TCGA Numeric Radiation
setClass("os.class.tcgaNumeric.radiation");
setAs("character","os.class.tcgaNumeric.radiation", function(from){
  
  # Convert Input Character Vector To Uppercase
  from<-toupper(from) 
  
  # Get Indexes Of Fram Where Value Is In NA
  from.na<-which(from %in% os.enum.na)
  
  # Set From Indexes Values To NA
  from[from.na]<-NA 
  
  from<- gsub("MCI|MILLICURIES|-MILLICURIE|MCI (3730 MBQ)|MILLICURIES 131-IODINE", "", from)
  trim(from)
  
  from <- as.numeric(from)
  
  if(all(is.numeric(from))) return (from)
  
  # Kill If Not In Enum or Na
  stop(paste("os.class.tcgaNumeric.radiation not properly set: ", from[!is.numeric(from)], collapse=";"))
  
})


### TCGA Numeric
setClass("os.class.tcgaNumeric");
setAs("character","os.class.tcgaNumeric", function(from){
  
  # Convert Input Character Vector To Uppercase
  from<-toupper(from) 
  
  # Get Indexes Of Fram Where Value Is In NA
  from.na<-which(from %in% os.enum.na)
  
  # Set From Indexes Values To NA
  from[from.na]<-NA 
  
  from <- as.numeric(from)
  
  if(all(is.numeric(from))) return (from)
  
  # Kill If Not In Enum or Na
  stop(paste("os.class.tcgaNumeric not properly set: ", from[!is.numeric(from)], collapse=";"))
  
})

### TCGA Boolean
setClass("os.class.tcgaBoolean");
setAs("character","os.class.tcgaBoolean", function(from){
  
  from<-toupper(from) 
  
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA  
  
  from.true <- which( from %in% os.enum.logical.true )
  from[from.true] <- "TRUE"
  
  from.false <- which(from %in% os.enum.logical.false )
  from[from.false] <- "FALSE"
  
  from <- as.logical(from)
  
  # Return Enum or NA        
  if( all(from %in% c( TRUE, FALSE, NA))) return( from )
  
  # Kill If Not In Enum or Na
  stop(paste("os.class.tcgaBoolean not properly set: ", setdiff(from,c( TRUE, FALSE, NA )), collapse=";"))
})

