#execfile("ucsc-xena-server/python/xena_query.py")
import xena_query as xena
import json
import os
import re
import numpy as np
from pymongo import MongoClient

huburl = "https://genome-cancer.ucsc.edu/proj/public/xena"
baseurl = "https://tcga.xenahubs.net/download"


user="oncoscape"
password = os.environ["dev_oncoscape_pw"]
host = "mongodb://" + user + ":" + password + "@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017"

mongo = MongoClient(host)
db = mongo.tcga
lookup = db.lookup_oncoscape_datasources
manifest = db.manifest


#Find all the cohorts at a huburl
#allCohorts = xena.all_cohorts(huburl)

def import_ucsc_molecular():

	#Find all available UCSC datasets
	allDatasets = xena.datasets_list (huburl)
	TCGAdatasets = [dataset for dataset in allDatasets if re.compile("^TCGA").match(dataset)]

	for dataset in TCGAdatasets:
	#	allDatasets = xena.datasets_list_in_cohort(huburl, cohort)
	#	dataset = allDatasets[1]
		print dataset
		
		metadata = dataset_metadata(baseurl, dataset)
		if len(metadata) == 0: continue
		if 'cohort' not in metadata: continue
			
		source = "ucsc xena"
		collection = metadata['name'] + "_" + source
		collection = collection.lower().replace(" ", "-") 
		name = cohort_dataset(metadata['cohort'])
		process = process_json(metadata)

		
		prev_run = insert_prep(collection)
		if(prev_run): continue

		##### DO NOT USE Python query as it returns different values than download. eg LGG RPPA 209 vs 229 identifiers
		#allidentifiers = xena.dataset_field(huburl, dataset)
		#allsamples = xena.dataset_samples(huburl, dataset)
		#values = xena.dataset_probe_values(huburl, dataset, allsamples, allidentifiers)
		#gene by patient nested matrix len(values) = genes, len(values[1]) = samples
		#print "Inserting by values"
		
		#insert document
		#	gene, min, max, data:{sampleID:val}
		#for i in range(0,len(values)):
		#	doc = {"gene": allidentifiers[i], "min": min(values[i]), "max": max(values[i]), "data": dict(zip(allsamples, values[i]))}
		#	db[collection].insert_one(doc)
		#success = True
		######

		success = import_ucsc_download(dataset, collection, metadata['type'])
		
		if not success: 
			print "------Unable to insert dataset------"
			continue	
			
		#insert into manifest
		#	dataset, dataType, date, source, process, processName, parent, collection
		#   + metadata
		if "url" in metadata: parent = metadata['url']
		elif 'path' in metadata: parent = metadata['path']
		else: parent = None
		doc = {"dataset": name, "dataType": metadata['label'],"date": metadata['version'], "source": source, "process": process, "processName": "", "parent": parent, "collection": collection }
		meta_doc = merge_json(doc, metadata)
		manifest.insert_one(meta_doc)
	
		#insert into lookup
		#  molecular: {source, type, collection}
		record = {"source": source , "type": metadata['label'], "collection": collection}
		lookup.update_one({"disease": name}, {"$push":{"molecular": record}}, upsert=True )
	

def dataset_metadata(host, dataset):
	metalink = host + xena.strip_first_url_dir(dataset) + ".json"
	req = xena.urllib2.Request(metalink)
	try:
		response = xena.urllib2.urlopen(req)
		result = response.read().decode('utf-8')
		return json.loads(result)
	except xena.urllib2.HTTPError, e:
		print "Metadata HTTPError: " + str(e.code)
		return {}
	except xena.urllib2.URLError, e:
		print "Metadata URLError: " + str(e.args)
		return {}

def cohort_dataset(name):
	dataset_name = re.search(r'.+\((.+)\)', name).group(1)
	if(dataset_name == "GBMLGG"):
		return "brain"
	return dataset_name.lower()
	
def process_json(metadata):
	process_keys = ["unit", "wrangler", "wrangling_procedure", "PLATFORM"]
	process = {}
	for key in process_keys:
		if key in metadata:
			process[key.lower()] = metadata[key]
	return process
			
def merge_json(json1, json2):
	return {key: value for (key, value) in (json1.items() + json2.items())}	

def import_ucsc_download(dataset, collection, type):
	link = baseurl + xena.strip_first_url_dir(dataset) 
	req = xena.urllib2.Request(link)
	try:
		response = xena.urllib2.urlopen(req)
		file = response.read().decode('utf-8')
		lines = file.split("\n")
	
		print "Inserting by download"
	
		allsamples = lines[0].split("\t")
		del allsamples[0]
		#save sample IDs from header row with 'sample' label removed from first column
	
		#insert document by gene
		#	gene, min, max, data:{sampleID:val}
		for i in range(1,len(lines)):
			values = lines[i].split("\t")
			if len(values) < 2: break
			identifier = values[0]
			del values[0]
			if type =="genomicMatrix":
				#np.set_printoptions(precision=10, suppress=True)
				values = np.genfromtxt(np.array(values),dtype=float)
			#read  each row, save the id and remove the name
			doc = {"gene": identifier, "min": min(values), "max": max(values), "data": dict(zip(allsamples, values))}
			db[collection].insert_one(doc)
		return True
	
	except xena.urllib2.HTTPError, e:
		print "Download HTTPError: " +  str(e.code)
		return False
	except xena.urllib2.URLError, e:
		print "Download URLError: " +  str(e.args)
		return False

def insert_prep(collection):

	if collection in db.collection_names(): 
		print collection + " already exists in database."
		return True

	if manifest.find_one( {"collection" : collection}) is not None: 
		print collection + " already exists in manifest."
		return True

	return False
	
if __name__ == '__main__':
	import_ucsc_molecular()