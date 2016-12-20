#! /bin/bash

#### Data Pipeline
#  	Create Files
#		Clinical Files
#		Molecular Tables (UCSC, cBio)
# 		Genomic Coordinates
#		Genesets
#	Calculate Values
#		Hobo MDS
#		Edges
#		Genomic Coordinates Scaled
#	Import into MongoDB
####

#----------------------------------------------------

default: setup run

setup: mapCoordinates

run: import cluster tools

#-----  Create Files

import:
	Rscript tcga.import.R
		# - reads ucsc.filename.manifest
		# - writes mol collections metatable
		# - writes UCSC molecular data json
		# - TO DO: cbio

mapCoordinates:
	Rscript hg19.save.genomic.coordinates.R
		# genomic coordinates

	#### TO DO: grab more genesets

#----- Calculate Values

cluster:
	Rscript networks.calculate.mds.edges.R
		# hobo MDS

#----- Create Tool Specific Views

tools: MnP colors

MnP:
	Rscript os.data.for.mnp.R
		# hobo MDS & PCA

colors:
	node color.options.js

#----- Import into MongoDB

setupMongo:
	npm install co-mongodb co underscore assert fs readline sync-request xmldom
	
