
lgg = list(
        "patient" = "lgg_patient_tcga_clinical",
        "drug" = "lgg_drug_tcga_clinical",
        "radiation" = "lgg_radiation_tcga_clinical",
        "followup" = "lgg_followup_tcga_v1p0",
        "newtumor" = "lgg_newtumor_tcga_clinical",
        "othermalignancy" = "lgg_othermalignancy_tcga_v4p0" )

 gbm =   list(
        "patient" = "gbm_patient_tcga_clinical",
        "drug" = "gbm_drug_tcga_clinical",
        "radiation" = "gbm_radiation_tcga_clinical",
        "followup" = "gbm_followup_tcga_v1p0",
        "newtumor" = "gbm_newtumor_tcga_clinical",
        "newtumor-followup" = "gbm_newtumor-followup_tcga_v1p0",
        "othermalignancy" = "gbm_othermalignancy_tcga_v4p0")


t<- sapply(names(lgg), function(dtype){
	oCollection1 = mongo.manifest$find(toJSON(list(collection = lgg[[dtype]]), auto_unbox=T))
	oCollection2 = mongo.manifest$find(toJSON(list(collection = gbm[[dtype]]), auto_unbox=T))
	
	oCollection = update.oCollection(oCollection1, dataset="brain", parent=c(oCollection1$`_id`, oCollection2$`_id`))
	
	merge.collections(oCollection1, oCollection2, oCollection)
	insert.lookup(oCollection)
})


db.getCollection('brain_patient_tcga_clinical')
.update({"primary_diagnosis": 
	{$in: ["GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY","GLIOBLASTOMA MULTIFORME TREATED PRIMARY","GLIOBLASTOMA MULTIFORME"]
	}}, {$set: {"study": "gbm"}}, {multi: true})

db.getCollection('brain_patient_tcga_clinical')
.update({"primary_diagnosis": 
	{$in: ["ASTROCYTOMA","OLIGODENDROGLIOMA", "OLIGOASTROCYTOMA"]
	}}, {$set: {"study": "lgg"}}, {multi: true})

