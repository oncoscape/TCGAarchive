
lgg <- mongo.lookup$distinct("clinical", toJSON(list(disease="lgg"), auto_unbox=T))
gbm <- mongo.lookup$distinct("clinical", toJSON(list(disease="gbm"), auto_unbox=T))



t<- sapply(names(lgg), function(dtype){
	oCollection1 = mongo.manifest$find(toJSON(list(collection = lgg[[dtype]]), auto_unbox=T))
	oCollection2 = mongo.manifest$find(toJSON(list(collection = gbm[[dtype]]), auto_unbox=T))
	
	oCollection = update.oCollection(oCollection1, dataset="brain", parent=c(oCollection1$`_id`, oCollection2$`_id`))
	
	append.collections(oCollection1, oCollection2, oCollection)
	insert.lookup(oCollection)
})


db.getCollection('brain_diagnosis')
.update({"primary_diagnosis": 
	{$in: ["GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY","GLIOBLASTOMA MULTIFORME TREATED PRIMARY","GLIOBLASTOMA MULTIFORME"]
	}}, {$set: {"study": "gbm"}}, {multi: true})

db.getCollection('brain_diagnosis')
.update({"primary_diagnosis": 
	{$in: ["ASTROCYTOMA","OLIGODENDROGLIOMA", "OLIGOASTROCYTOMA"]
	}}, {$set: {"study": "lgg"}}, {multi: true})

