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
random_pos = sample(1:nrow(brs), 20)
random_IDs = brs$patient_ID[random_pos]
brs_sample = brs[random_pos,]
km.as.sp <- survfit(SurvObj ~ 1, data = brs_sample, conf.type ="log-log")
pdf(file="survival/brs_rnd20.pdf")
plot(km.as.sp)
dev.off()

// random_IDs
// TCGA-06-0744,TCGA-S9-A6WH,TCGA-06-1802,TCGA-08-0244,TCGA-15-1444,
// TCGA-QH-A6CY,TCGA-06-0165,TCGA-E1-5303,TCGA-HT-7860,TCGA-DU-5851,
// TCGA-26-5136,TCGA-CS-4941,TCGA-CS-4944,TCGA-16-1060,TCGA-12-1088,
// TCGA-RY-A83Y,TCGA-27-2528,TCGA-76-4932,TCGA-RY-A843,TCGA-P5-A72U
