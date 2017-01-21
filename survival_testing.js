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
brs_sample = tail(brs[order(brs$patient_ID),], n=29)
km.as.sp <- survfit(SurvObj ~ 1, data = brs_sample, conf.type ="log-log")

