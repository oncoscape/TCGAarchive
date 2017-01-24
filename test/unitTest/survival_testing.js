library(RCurl)
library(RUnit)
library(survival)
source("common.R")
source("bindToEnv.R")
source("../../scripts/networks.calculate.mds.edges.R")
db <- "tcga"
mongo <- connect.to.mongo()
con <- mongo("brain_patient_tcga_clinical", db=db, url=host)
brain_pt <- con$find()
rm(con) 
brs = brain_pt[order(brain_pt$days_to_death),c(2,16,18)]
brs$SurvObj <- with(brs, Surv(days_to_death, status_vital=="DEAD"))
km.as.one <- survfit(SurvObj ~ 1, data = brs, conf.type ="log-log")
pdf(file="survival/brain_survival.pdf")
random_pos = sample(1:nrow(brs), 20)
random_IDs = brs$patient_ID[random_pos]
print(random_IDs)
brs_sample = brs[random_pos,]
km.as.sp <- survfit(SurvObj ~ 1, data = brs_sample, conf.type ="log-log")
pdf(file="survival/brain_survival_rnd20.pdf")
plot(km.as.sp)
dev.off()

con <- mongo("lookup_oncoscape_datasources", db=db, url=host)
clinical <- con$find(,toJSON(list("disease"=1, "clinical"=1), auto_unbox=T))
all_patient_collections <- clinical[,3][,"patient"]
for(i in 1:length(all_patient_collections)){
	print(all_patient_collections[i])
	if(!is.na(all_patient_collections[i])){
		con <- mongo(all_patient_collections[i], db=db, url=host)
		pt <- con$find()
		brs = pt[order(pt$days_to_death),c("patient_ID", "days_to_death", "status_vital")]
		rm(con)
		brs$SurvObj <- with(brs, Surv(days_to_death, status_vital=="DEAD"))
		km.as.one <- survfit(SurvObj ~ 1, data = brs, conf.type ="log-log")
		pdf(file=paste("survival/", all_patient_collections[i], ".pdf"))
		plot(km.as.one)
		dev.off()
		random_pos = sample(1:nrow(brs), 20)
		random_IDs = brs$patient_ID[random_pos]
		print(random_IDs)
		brs_sample = brs[random_pos,]
		km.as.sp <- survfit(SurvObj ~ 1, data = brs_sample, conf.type ="log-log")
		pdf(file=paste("survival/", all_patient_collections[i], "_random20.pdf"))
		plot(km.as.sp)
		dev.off()
	}
}

