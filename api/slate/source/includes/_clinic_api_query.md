
# Rest API Queries

## Example to access one collection from browser

### HTTP Request

Collections are accessable at the host: http://dev.oncoscape.sttrcancer.io/api/

The endpoint of oncoscape API is a unique URL. Every endpoint points to a unique collection.
Below lists more details of the organization of the Oncoscape Mongo Database and the collections organized by disease type.

`GET http://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical/`


> Here we only show the first record in gbm_patient_tcga_clinical


```

{
    "_id": "57c9a095d482221d835e6018",
    "patient_ID": "TCGA-02-0001-01",
    "history_lgg_dx_of_brain_tissue": false,
    "prospective_collection": null,
    "retrospective_collection": null,
    "gender": "FEMALE",
    "days_to_birth": -16179,
    "race": "WHITE",
    "ethnicity": "NOT HISPANIC OR LATINO",
    "history_other_malignancy": null,
    "history_neoadjuvant_treatment": true,
    "diagnosis_year": 1009872000,
    "pathologic_method": "TUMOR RESECTION",
    "pathologic_method.1": null,
    "status_vital": "DEAD",
    "days_to_last_contact": 279,
    "days_to_death": 358,
    "status_tumor": "WITH TUMOR",
    "KPS": 80,
    "ECOG": null,
    "encounter_type": null,
    "radiation_treatment_adjuvant": null,
    "pharmaceutical_tx_adjuvant": null,
    "treatment_outcome_first_course": null,
    "new_tumor_event_diagnosis": null,
    "age_at_initial_pathologic_diagnosis": 44,
    "anatomic_organ_subdivision": null,
    "days_to_diagnosis": 0,
    "disease_code": null,
    "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY",
    "icd_10": "C71.9",
    "icd_3_histology": "9440/3",
    "icd_3": "C71.9",
    "tissue_source_site_code": "02",
    "tumor_tissue_site": "BRAIN"
}
```


## Query Collection from Browser

### HTTP Request

> Here we show the first two records that meet the below criteria: gender is male, race is white. We have skipped the first five records from the results. And we only show three fields (patient_ID, gender and race.


```

[
    {
        "_id": "57c9a096d482221d835e6025",
        "patient_ID": "TCGA-02-0024-01",
        "gender": "MALE",
        "race": "WHITE",
        "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME TREATED PRIMARY"
    },
    {
        "_id": "57c9a096d482221d835e6026",
        "patient_ID": "TCGA-02-0025-01",
        "gender": "MALE",
        "race": "WHITE",
        "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY"
    }
]
```


Filter by gender and race and only show the selected fields

`GET http://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical/?q={"gender":"MALE", "race":"WHITE","$fields":["gender","race","patient_ID"],"$skip":5,"$limit":2}`


only show gender, race and patient_ID

`"$fields":["gender","race","patient_ID"]`


skip the first five records

`"$skip":5`


limit the final output to two records.

`"$limit":2`


## Fetch JSON-Formatted Data Using Programming Languages

> Fetch JSON formatted data using R, Python, or javascript


```javascript
var collection = "gbm_patient_tcga_clinical";
var url = "https://dev.oncoscape.sttrcancer.io/api/" + collection + "/?q=";
$.get(url, function(data) {
     var field_names = Object.keys(data[0]);
     var count = data.length;
     console.log("fields name of the first records: " + field_names);
     console.log("counts: " + count);
  });
```


```r
install.packages("jsonlite")
install.packages("curl")
library(jsonlite)
library(curl)
gbm_patient <- fromJSON("https://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical")
str(gbm_patient, max.level=2)
'data.frame': 596 obs. of  33 variables:
$ patient_ID                         : chr  "TCGA-02-0001-01" "TCGA-02-0003-01" "TCGA-02-0004-01" "TCGA-02-0006-01" ...
$ history_lgg_dx_of_brain_tissue     : logi  FALSE FALSE FALSE FALSE FALSE FALSE ...
$ prospective_collection             : logi  NA NA NA NA NA NA ...
$ retrospective_collection           : logi  NA NA NA NA NA NA ...
$ gender                             : chr  "FEMALE" "MALE" "MALE" "FEMALE" ...
$ days_to_birth                      : int  -16179 -18341 -21617 -20516 -14806 -22457 -7452 -6926 -9369 -18404 ...
$ race                               : chr  "WHITE" "WHITE" "WHITE" "WHITE" ...
$ ethnicity                          : chr  "NOT HISPANIC OR LATINO" "NOT HISPANIC OR LATINO" "NOT HISPANIC OR LATINO" "NOT HISPANIC OR LATINO" ...
$ history_other_malignancy           : logi  NA NA NA NA NA NA ...
$ history_neoadjuvant_treatment      : logi  TRUE FALSE FALSE FALSE TRUE FALSE ...
$ diagnosis_year                     : int  1009872000 1041408000 1009872000 1009872000 1009872000 1041408000 1009872000 1072944000 852105600 1009872000 ...
$ pathologic_method                  : logi  NA NA NA NA NA NA ...
$ pathologic_method                  : logi  NA NA NA NA NA NA ...
$ status_vital                       : chr  "DEAD" "DEAD" "DEAD" "DEAD" ...
$ days_to_last_contact               : int  279 144 345 558 705 322 1077 630 2512 627 ...
$ days_to_death                      : int  358 144 345 558 705 322 1077 630 2512 627 ...
$ status_tumor                       : chr  "WITH TUMOR" "WITH TUMOR" "WITH TUMOR" "WITH TUMOR" ...
$ KPS                                : int  80 100 80 80 80 80 80 80 100 80 ...
$ ECOG                               : int  NA NA NA NA NA NA NA NA NA NA ...
$ encounter_type                     : chr  NA NA NA NA ...
$ radiation_treatment_adjuvant       : logi  NA NA NA NA NA NA ...
$ pharmaceutical_tx_adjuvant         : logi  NA NA NA NA NA NA ...
$ treatment_outcome_first_course     : chr  NA NA NA NA ...
$ new_tumor_event_diagnosis          : logi  NA NA NA NA NA NA ...
$ age_at_initial_pathologic_diagnosis: int  44 50 59 56 40 61 20 18 25 50 ...
$ anatomic_organ_subdivision         : logi  NA NA NA NA NA NA ...
$ days_to_diagnosis                  : int  0 0 0 0 0 0 0 0 0 0 ...
$ disease_code                       : logi  NA NA NA NA NA NA ...
$ histologic_diagnosis               : chr  "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY" ...
$ icd_10                             : chr  "C71.9" "C71.9" "C71.9" "C71.9" ...
$ icd_3_histology                    : chr  "9440/3" "9440/3" "9440/3" "9440/3" ...
$ icd_3                              : chr  "C71.9" "C71.9" "C71.9" "C71.9" ...
$ tissue_source_site_code            : chr  "02" "02" "02" "02" ...
$ tumor_tissue_site                  : chr  "BRAIN" "BRAIN" "BRAIN" "BRAIN" ...
```


```python

> shell commands: sudo pip install pymongo, simplejson, urllib2, json

import urllib2
import json
import simplejson
url = "https://dev.oncoscape.sttrcancer.io/api/gbm_patient_tcga_clinical"
response = urlli2.urlopen(url)
data = simplejson.load(response)
print json.dumps(data[0:2], indent=4, sort_keys=True)

[
    {
        "ECOG": null,
        "KPS": 80,
        "age_at_initial_pathologic_diagnosis": 44,
        "anatomic_organ_subdivision": null,
        "days_to_birth": -16179,
        "days_to_death": 358,
        "days_to_diagnosis": 0,
        "days_to_last_contact": 279,
        "diagnosis_year": 1009872000,
        "disease_code": null,
        "encounter_type": null,
        "ethnicity": "NOT HISPANIC OR LATINO",
        "gender": "FEMALE",
        "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY",
        "history_lgg_dx_of_brain_tissue": false,
        "history_neoadjuvant_treatment": true,
        "history_other_malignancy": null,
        "icd_10": "C71.9",
        "icd_3": "C71.9",
        "icd_3_histology": "9440/3",
        "new_tumor_event_diagnosis": null,
        "pathologic_method": null,
        "patient_ID": "TCGA-02-0001-01",
        "pharmaceutical_tx_adjuvant": null,
        "prospective_collection": null,
        "race": "WHITE",
        "radiation_treatment_adjuvant": null,
        "retrospective_collection": null,
        "status_tumor": "WITH TUMOR",
        "status_vital": "DEAD",
        "tissue_source_site_code": "02",
        "treatment_outcome_first_course": null,
        "tumor_tissue_site": "BRAIN"
    },
    {
        "ECOG": null,
        "KPS": 100,
        "age_at_initial_pathologic_diagnosis": 50,
        "anatomic_organ_subdivision": null,
        "days_to_birth": -18341,
        "days_to_death": 144,
        "days_to_diagnosis": 0,
        "days_to_last_contact": 144,
        "diagnosis_year": 1041408000,
        "disease_code": null,
        "encounter_type": null,
        "ethnicity": "NOT HISPANIC OR LATINO",
        "gender": "MALE",
        "histologic_diagnosis": "GLIOBLASTOMA MULTIFORME UNTREATED PRIMARY",
        "history_lgg_dx_of_brain_tissue": false,
        "history_neoadjuvant_treatment": false,
        "history_other_malignancy": null,
        "icd_10": "C71.9",
        "icd_3": "C71.9",
        "icd_3_histology": "9440/3",
        "new_tumor_event_diagnosis": null,
        "pathologic_method": null,
        "patient_ID": "TCGA-02-0003-01",
        "pharmaceutical_tx_adjuvant": null,
        "prospective_collection": null,
        "race": "WHITE",
        "radiation_treatment_adjuvant": null,
        "retrospective_collection": null,
        "status_tumor": "WITH TUMOR",
        "status_vital": "DEAD",
        "tissue_source_site_code": "02",
        "treatment_outcome_first_course": null,
        "tumor_tissue_site": "BRAIN"
    }
]
```


Users can access json-formatted data using URL link.

Here we show the example to access one collection using four different languages.

# Collections by Disease

## BRAIN - Lower Grade Glioma & Glioblastoma multiforme

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
brain_color_tcga_import | category | tcga | color
brain_events_tcga_clinical | clinical | tcga | color
brain_patient_tcga_clinical | clinical | tcga | color
brain_drug_tcga_clinical | clinical | tcga | color
brain_newtumor_tcga_clinical | clinical | tcga | color
brain_othermalignancy_tcga_v4p0 | clinical | tcga | color
brain_radiation_tcga_clinical | clinical | tcga | color
brain_mut_broad_mutsig2 | molecular | broad | mut
brain_mut01_broad_mutsig2 | molecular | broad | mut01
brain_methylation_cbio_hm27 | molecular | cBio | methylation
brain_cnv_ucsc-pnas_gistic | molecular | ucsc-PNAS | cnv
brain_mut01_ucsc-pnas_import | molecular | ucsc-PNAS | mut01
brain_cnv_ucsc_gistic | molecular | ucsc | cnv
brain_mut01_ucsc_import | molecular | ucsc | mut01
brain_cnv_cbio_gistic | molecular | cBio | cnv
brain_mut_cbio_wxs | molecular | cBio | mut
brain_mut01_cbio_wxs | molecular | cBio | mut01

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "brain_cnv_ucsc_gistic",
    "RawDataUrl": "",
    "sampleSize": 1090,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": ""
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "brain_mut01_ucsc_import",
    "RawDataUrl": "",
    "sampleSize": 818,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": ""
}
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
brain_cnv_ucsc_gistic | ucsc | cnv | 1090 | 
brain_mut01_ucsc_import | ucsc | mut01 | 818 | 

## BRCA - Breast invasive carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
brca_color_tcga_import | category | tcga | color
brca_events_tcga_clinical | clinical | tcga | color
brca_patient_tcga_clinical | clinical | tcga | color
brca_drug_tcga_clinical | clinical | tcga | color
brca_radiation_tcga_clinical | clinical | tcga | color
brca_followup_tcga_v4p0 | clinical | tcga | color
brca_newtumor_tcga_clinical | clinical | tcga | color
brca_newtumor-followup_tcga_v4p0 | clinical | tcga | color
brca_othermalignancy_tcga_v4p0 | clinical | tcga | color
brca_mut_broad_mutsig2 | molecular | broad | mut
brca_psi_bradleyLab_miso | molecular | bradleyLab | psi
brca_mut01_broad_mutsig2 | molecular | broad | mut01
brca_cnv_cbio_gistic | molecular | cBio | cnv
brca_mut_cbio_wxs | molecular | cBio | mut
brca_mut01_cbio_wxs | molecular | cBio | mut01
brca_methylation_cbio_hm27 | molecular | cBio | methylation
brca_methylation_cbio_hm450 | molecular | cBio | methylation
brca_rna_cbio_agilent-median-zscore | molecular | cBio | rna
brca_rna_cbio_seq-median-zscore | molecular | cBio | rna
brca_protein_cbio_rppa-zscore | molecular | cBio | protein
brca_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
brca_mut01_ucsc_mutationcuratedwustlgene | molecular | ucsc | mut01

### More Details of Molecular Collections

```

{
    "source": "cbio",
    "type": "cnv",
    "collection": "brca_cnv_cbio_gistic",
    "sampleSize": 1079,
    "GENETIC_ALTERATION_TYPE": "COPY_NUMBER_ALTERATION",
    "DATATYPE": "DISCRETE",
    "NAME": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 1079 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification."
}
```


```

{
    "source": "cbio",
    "type": "mut",
    "collection": "brca_mut_cbio_wxs",
    "sampleSize": 980,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "methylation",
    "collection": "brca_methylation_cbio_hm27",
    "sampleSize": 315,
    "GENETIC_ALTERATION_TYPE": "METHYLATION",
    "DATATYPE": "CONTINUOUS",
    "NAME": "Methylation (HM27)",
    "description": "Methylation (HM27) beta-values for genes in 342 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression."
}
```


```

{
    "source": "cbio",
    "type": "methylation",
    "collection": "brca_methylation_cbio_hm450",
    "sampleSize": 737,
    "GENETIC_ALTERATION_TYPE": "METHYLATION",
    "DATATYPE": "CONTINUOUS",
    "NAME": "Methylation (HM450)",
    "description": "Methylation (HM450) beta-values for genes in 833 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression."
}
```


```

{
    "source": "cbio",
    "type": "protein",
    "collection": "brca_protein_cbio_rppa-zscore",
    "sampleSize": 409,
    "GENETIC_ALTERATION_TYPE": "PROTEIN_ARRAY_PROTEIN_LEVEL",
    "DATATYPE": "Z-SCORE",
    "NAME": "protein/phosphoprotein level (RPPA)",
    "description": "Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)"
}
```


```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "brca_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/BRCA/20141017/",
    "sampleSize": 1079,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA breast invasive carcinoma (BRCA) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
brca_cnv_cbio_gistic | cbio | cnv | 1079 | Putative copy-number calls on 1079 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.
brca_mut_cbio_wxs | cbio | mut | 980 | Mutation data from whole exome sequencing.
brca_methylation_cbio_hm27 | cbio | methylation | 315 | Methylation (HM27) beta-values for genes in 342 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression.
brca_methylation_cbio_hm450 | cbio | methylation | 737 | Methylation (HM450) beta-values for genes in 833 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression.
brca_protein_cbio_rppa-zscore | cbio | protein | 409 | Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)
brca_cnv_ucsc_gistic2thd | ucsc | cnv | 1079 | TCGA breast invasive carcinoma (BRCA) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined

## ESCA - Esophageal carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
esca_drug_tcga_clinical | clinical | TCGA | 
esca_followup_tcga_v4p0 | clinical | TCGA | 
esca_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
esca_newtumor_tcga_clinical | clinical | TCGA | 
esca_othermalignancy_tcga_v4p0 | clinical | TCGA | 
esca_patient_tcga_clinical | clinical | TCGA | 
esca_radiation_tcga_clinical | clinical | TCGA | 
esca_mut_broad_mutsig2 | molecular | broad | mut
esca_mut01_broad_mutsig2 | molecular | broad | mut01
esca_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
esca_rna_ucsc_hiseq | molecular | ucsc | rna
esca_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "esca_cnv_ucsc_gistic2thd",
    "RawDataUrl": " http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/ESCA/20141017/",
    "sampleSize": 184,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA esophageal carcinoma (ESCA) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
esca_cnv_ucsc_gistic2thd | ucsc | cnv | 184 | TCGA esophageal carcinoma (ESCA) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## GBM - Glioblastoma multiforme

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
gbm_events_tcga_clinical | clinical | TCGA | 
gbm_patient_tcga_clinical | clinical | TCGA | 
gbm_drug_tcga_clinical | clinical | TCGA | 
gbm_radiation_tcga_clinical | clinical | TCGA | 
gbm_followup_tcga_v1p0 | clinical | TCGA | 
gbm_newtumor_tcga_clinical | clinical | TCGA | 
gbm_newtumor-followup_tcga_v1p0 | clinical | TCGA | 
gbm_othermalignancy_tcga_v4p0 | clinical | TCGA | 
gbm_mut_broad_mutsig2 | molecular | broad | mut
gbm_mut01_broad_mutsig2 | molecular | broad | mut01
gbm_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
gbm_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
gbm_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "gbm_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/GBM/20141017/",
    "sampleSize": 577,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA glioblastoma multiforme (GBM) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
gbm_cnv_ucsc_gistic2thd | ucsc | cnv | 577 | TCGA glioblastoma multiforme (GBM) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## HNSC - Head and Neck squamous cell carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
hnsc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
hnsc_events_tcga_clinical | clinical | TCGA | 
hnsc_patient_tcga_na | clinical | TCGA | 
hnsc_drug_tcga_clinical | clinical | TCGA | 
hnsc_radiation_tcga_clinical | clinical | TCGA | 
hnsc_followup_tcga_v4p8 | clinical | TCGA | 
hnsc_newtumor_tcga_clinical | clinical | TCGA | 
hnsc_newtumor-followup_tcga_v4p8 | clinical | TCGA | 
hnsc_mut_broad_mutsig2 | molecular | broad | mut
hnsc_mut01_broad_mutsig2 | molecular | broad | mut01
hnsc_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
hnsc_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
hnsc_cnv_cbio_gistic | molecular | cBio | cnv
hnsc_mut_cbio_mut | molecular | cBio | mut
hnsc_mut01_cbio_mut | molecular | cBio | mut01
hnsc_methylation_cbio_hm450 | molecular | cBio | methylation
hnsc_protein_cbio_rppa | molecular | cBio | protein
hnsc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "hnsc_cnv_ucsc_gistic2thd",
    "RawDataUrl": " http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/HNSC/20141017/",
    "sampleSize": 522,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA head & neck squamous cell carcinoma (HNSC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "hnsc_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": "https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/hnsc/gsc/broad.mit.edu/illuminaga_dnaseq_automated/mutations/",
    "sampleSize": 509,
    "wrangler": "cgData TCGAscript maf processed on 2015-01-27",
    "wranglingProcedure": "Download .maf file from TCGA DCC, processed into gene by sample matrix at UCSC, stored in the UCSC Xena repository",
    "description": "TCGA head & neck squamous cell carcinoma (HNSC) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method. "
}
```


```

{
    "source": "cbio",
    "type": "cnv",
    "collection": "hnsc_cnv_cbio_gistic",
    "sampleSize": 522,
    "GENETIC_ALTERATION_TYPE": "COPY_NUMBER_ALTERATION",
    "DATATYPE": "DISCRETE",
    "NAME": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 522 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification."
}
```


```

{
    "source": "cbio",
    "type": "mut",
    "collection": "hnsc_mut_cbio_mut",
    "sampleSize": 306,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "mut01",
    "collection": "hnsc_mut01_cbio_mut",
    "sampleSize": 306,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Binary mutation data from whole exome sequencing. "
}
```


```

{
    "source": "cbio",
    "type": "protein",
    "collection": "hnsc_protein_cbio_rppa",
    "sampleSize": 212,
    "GENETIC_ALTERATION_TYPE": "PROTEIN_ARRAY_PROTEIN_LEVEL",
    "DATATYPE": "Z-SCORE",
    "NAME": "protein/phosphoprotein level (RPPA)",
    "description": "Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)"
}
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
hnsc_cnv_ucsc_gistic2thd | ucsc | cnv | 522 | TCGA head & neck squamous cell carcinoma (HNSC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
hnsc_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 509 | TCGA head & neck squamous cell carcinoma (HNSC) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method. 
hnsc_cnv_cbio_gistic | cbio | cnv | 522 | Putative copy-number calls on 522 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.
hnsc_mut_cbio_mut | cbio | mut | 306 | Mutation data from whole exome sequencing.
hnsc_mut01_cbio_mut | cbio | mut01 | 306 | Binary mutation data from whole exome sequencing. 
hnsc_protein_cbio_rppa | cbio | protein | 212 | Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)
undefined | undefined | undefined | undefined | undefined

## KICH - Kidney Chromophobe

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
kich_drug_tcga_clinical | clinical | TCGA | 
kich_followup_tcga_v4p4 | clinical | TCGA | 
kich_newtumor-followup_tcga_v4p4 | clinical | TCGA | 
kich_newtumor_tcga_clinical | clinical | TCGA | 
kich_othermalignancy_tcga_v4p0 | clinical | TCGA | 
kich_patient_tcga_clinical | clinical | TCGA | 
kich_radiation_tcga_clinical | clinical | TCGA | 
kich_mut_broad_mutsig2 | molecular | broad | mut
kich_mut01_broad_mutsig2 | molecular | broad | mut01
kich_rna_ucsc_hiseq | molecular | ucsc | rna
kich_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## KIRC - Kidney renal clear cell carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
kirc_drug_tcga_clinical | clinical | TCGA | 
kirc_followup_tcga_v1p0 | clinical | TCGA | 
kirc_newtumor_tcga_clinical | clinical | TCGA | 
kirc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
kirc_patient_tcga_clinical | clinical | TCGA | 
kirc_radiation_tcga_clinical | clinical | TCGA | 
kirc_mut_broad_mutsig2 | molecular | broad | mut
kirc_mut01_broad_mutsig2 | molecular | broad | mut01

### More Details of Molecular Collections

Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------

## KIRP - Kidney renal papillary cell carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
kirp_drug_tcga_clinical | clinical | TCGA | 
kirp_followup_tcga_v1p0 | clinical | TCGA | 
kirp_newtumor_tcga_clinical | clinical | TCGA | 
kirp_othermalignancy_tcga_v4p0 | clinical | TCGA | 
kirp_patient_tcga_clinical | clinical | TCGA | 
kirp_radiation_tcga_clinical | clinical | TCGA | 
kirp_mut_broad_mutsig2 | molecular | broad | mut
kirp_mut01_broad_mutsig2 | molecular | broad | mut01
kirp_rna_ucsc_hiseq | molecular | ucsc | rna
kirp_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## LGG - Brain Lower Grade Glioma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
lgg_newtumor_tcga_clinical | clinical | TCGA | 
lgg_events_tcga_clinical | clinical | TCGA | 
lgg_patient_tcga_clinical | clinical | TCGA | 
lgg_drug_tcga_clinical | clinical | TCGA | 
lgg_radiation_tcga_clinical | clinical | TCGA | 
lgg_followup_tcga_v1p0 | clinical | TCGA | 
lgg_othermalignancy_tcga_v4p0 | clinical | TCGA | 
lgg_mut_broad_mutsig2 | molecular | broad | mut
lgg_mut01_broad_mutsig2 | molecular | broad | mut01
lgg_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
lgg_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
lgg_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "lgg_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/LGG/20141017/",
    "sampleSize": 513,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA brain lower grade glioma (LGG) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "lgg_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": "",
    "sampleSize": 408,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": "The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample."
}
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
lgg_cnv_ucsc_gistic2thd | ucsc | cnv | 513 | TCGA brain lower grade glioma (LGG) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
lgg_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 408 | The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample.
undefined | undefined | undefined | undefined | undefined

## LIHC - undefined

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
lihc_drug_tcga_clinical | clinical | TCGA | 
lihc_followup_tcga_v4p0 | clinical | TCGA | 
lihc_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
lihc_newtumor_tcga_clinical | clinical | TCGA | 
lihc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
lihc_patient_tcga_clinical | clinical | TCGA | 
lihc_radiation_tcga_clinical | clinical | TCGA | 
lihc_mut_broad_mutsig2 | molecular | broad | mut
lihc_mut01_broad_mutsig2 | molecular | broad | mut01
lihc_rna_ucsc_hiseq | molecular | ucsc | rna
lihc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## LUAD - Lung adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
luad_events_tcga_clinical | clinical | TCGA | 
luad_patient_tcga_clinical | clinical | TCGA | 
luad_drug_tcga_clinical | clinical | TCGA | 
luad_radiation_tcga_clinical | clinical | TCGA | 
luad_followup_tcga_v1p0 | clinical | TCGA | 
luad_newtumor_tcga_clinical | clinical | TCGA | 
luad_othermalignancy_tcga_v4p0 | clinical | TCGA | 
luad_mut_broad_mutsig2 | molecular | broad | mut
luad_mut01_broad_mutsig2 | molecular | broad | mut01
luad_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
luad_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
luad_cnv_cbio_gistic | molecular | cBio | cnv
luad_mut_cbio_mut | molecular | cBio | mut
luad_mut01_cbio_mut | molecular | cBio | mut01
luad_methylation_cbio_hm27 | molecular | cBio | methylation
luad_methylation_cbio_hm450 | molecular | cBio | methylation
luad_rna_cbio_agilent | molecular | cBio | rna
luad_rna_cbio_seq | molecular | cBio | rna
luad_protein_cbio_rppa | molecular | cBio | protein
luad_rna_ucsc_hiseq | molecular | ucsc | rna
luad_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "luad_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/LUAD/20141017/",
    "sampleSize": 515,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA lung adenocarcinoma (LUAD) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "luad_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": "https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/luad/gsc/broad.mit.edu/illuminaga_dnaseq_automated/mutations/",
    "sampleSize": 543,
    "wrangler": "cgData TCGAscript maf processed on 2015-01-27",
    "wranglingProcedure": "Download .maf file from TCGA DCC, processed into gene by sample matrix at UCSC, stored in the UCSC Xena repository",
    "description": "TCGA lung adenocarcinoma (LUAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method. "
}
```


```

{
    "source": "cbio",
    "type": "cnv",
    "collection": "luad_cnv_cbio_gistic",
    "sampleSize": 515,
    "GENETIC_ALTERATION_TYPE": "COPY_NUMBER_ALTERATION",
    "DATATYPE": "DISCRETE",
    "NAME": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 515 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification."
}
```


```

{
    "source": "cbio",
    "type": "mut",
    "collection": "luad_mut_cbio_mut",
    "sampleSize": 229,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "mut01",
    "collection": "luad_mut01_cbio_mut",
    "sampleSize": 229,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Binary mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "protein",
    "collection": "luad_protein_cbio_rppa",
    "sampleSize": 181,
    "GENETIC_ALTERATION_TYPE": "PROTEIN_ARRAY_PROTEIN_LEVEL",
    "DATATYPE": "Z-SCORE",
    "NAME": "protein/phosphoprotein level (RPPA)",
    "description": "Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)"
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
luad_cnv_ucsc_gistic2thd | ucsc | cnv | 515 | TCGA lung adenocarcinoma (LUAD) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
luad_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 543 | TCGA lung adenocarcinoma (LUAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method. 
luad_cnv_cbio_gistic | cbio | cnv | 515 | Putative copy-number calls on 515 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.
luad_mut_cbio_mut | cbio | mut | 229 | Mutation data from whole exome sequencing.
luad_mut01_cbio_mut | cbio | mut01 | 229 | Binary mutation data from whole exome sequencing.
luad_protein_cbio_rppa | cbio | protein | 181 | Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## LUSC - Lung squamous cell carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
lusc_events_tcga_clinical | clinical | TCGA | 
lusc_patient_tcga_clinical | clinical | TCGA | 
lusc_drug_tcga_clinical | clinical | TCGA | 
lusc_radiation_tcga_clinical | clinical | TCGA | 
lusc_followup_tcga_v1p0 | clinical | TCGA | 
lusc_newtumor_tcga_clinical | clinical | TCGA | 
lusc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
lusc_mut_broad_mutsig2 | molecular | broad | mut
lusc_mut01_broad_mutsig2 | molecular | broad | mut01
lusc_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
lusc_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
lusc_cnv_cbio_gistic | molecular | cBio | cnv
lusc_mut_cbio_mut | molecular | cBio | mut
lusc_mut01_cbio_mut | molecular | cBio | mut01
lusc_methylation_cbio_hm27 | molecular | cBio | methylation
lusc_methylation_cbio_hm450 | molecular | cBio | methylation
lusc_rna_cbio_agilent | molecular | cBio | rna
lusc_rna_cbio_seq | molecular | cBio | rna
lusc_rna_cbio_u133 | molecular | cBio | rna
lusc_protein_cbio_rppa | molecular | cBio | protein
lusc_rna_ucsc_hiseq | molecular | ucsc | rna
lusc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "lusc_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/LUSC/20141017/",
    "sampleSize": 501,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA lung squamous cell carcinoma (LUSC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "lusc_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": "",
    "sampleSize": 408,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": "The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample."
}
```


```

{
    "source": "cbio",
    "type": "cnv",
    "collection": "lusc_cnv_cbio_gistic",
    "sampleSize": 32,
    "GENETIC_ALTERATION_TYPE": "COPY_NUMBER_ALTERATION",
    "DATATYPE": "DISCRETE",
    "NAME": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 501 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification."
}
```


```

{
    "source": "cbio",
    "type": "mut",
    "collection": "lusc_mut_cbio_mut",
    "sampleSize": 178,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "mut01",
    "collection": "lusc_mut01_cbio_mut",
    "sampleSize": 178,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "protein",
    "collection": "lusc_protein_cbio_rppa",
    "sampleSize": 0,
    "GENETIC_ALTERATION_TYPE": "PROTEIN_ARRAY_PROTEIN_LEVEL",
    "DATATYPE": "Z-SCORE",
    "NAME": "protein/phosphoprotein level (RPPA)",
    "description": "Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)"
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
lusc_cnv_ucsc_gistic2thd | ucsc | cnv | 501 | TCGA lung squamous cell carcinoma (LUSC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
lusc_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 408 | The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample.
lusc_cnv_cbio_gistic | cbio | cnv | 32 | Putative copy-number calls on 501 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.
lusc_mut_cbio_mut | cbio | mut | 178 | Mutation data from whole exome sequencing.
lusc_mut01_cbio_mut | cbio | mut01 | 178 | Mutation data from whole exome sequencing.
lusc_protein_cbio_rppa | cbio | protein | 0 | Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## SARC - Sarcoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
sarc_patient_tcga_clinical | clinical | TCGA | 
sarc_drug_tcga_clinical | clinical | TCGA | 
sarc_radiation_tcga_clinical | clinical | TCGA | 
sarc_followup_tcga_v4p0 | clinical | TCGA | 
sarc_newtumor_tcga_clinical | clinical | TCGA | 
sarc_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
sarc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
sarc_mut_broad_mutsig2 | molecular | broad | mut
sarc_mut01_broad_mutsig2 | molecular | broad | mut01
sarc_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
sarc_rna_ucsc_hiseq | molecular | ucsc | rna
sarc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "sarc_cnv_ucsc_gistic2thd",
    "RawDataUrl": " http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/SARC/20141017/",
    "sampleSize": 257,
    "wrangler": "   cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA sarcoma (SARC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
sarc_cnv_ucsc_gistic2thd | ucsc | cnv | 257 | TCGA sarcoma (SARC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## PAAD - Pancreatic adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
paad_patient_tcga_clinical | clinical | TCGA | 
paad_drug_tcga_clinical | clinical | TCGA | 
paad_radiation_tcga_clinical | clinical | TCGA | 
paad_followup_tcga_v4p4 | clinical | TCGA | 
paad_newtumor_tcga_clinical | clinical | TCGA | 
paad_newtumor-followup_tcga_v4p4 | clinical | TCGA | 
paad_othermalignancy_tcga_v4p0 | clinical | TCGA | 
paad_mut_broad_mutsig2 | molecular | broad | mut
paad_mut01_broad_mutsig2 | molecular | broad | mut01
paad_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
paad_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
paad_cnv_cbio_gistic | molecular | cBio | cnv
paad_mut_cbio_mut | molecular | cBio | mut
paad_mut01_cbio_mut | molecular | cBio | mut01
paad_rna_cbio_seq | molecular | cBio | rna
paad_rna_ucsc_hiseq | molecular | ucsc | rna
paad_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "paad_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/PAAD/20141017/",
    "sampleSize": 184,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA pancreatic adenocarcinoma (PAAD) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "paad_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": "https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/paad/gsc/hgsc.bcm.edu/illuminaga_dnaseq_automated/mutations/",
    "sampleSize": 131,
    "wrangler": "cgData TCGAscript maf processed on 2015-01-27",
    "wranglingProcedure": "Download .maf file from TCGA DCC, processed into gene by sample matrix at UCSC, stored in the UCSC Xena repository",
    "description": "TCGA pancreatic adenocarcinoma (PAAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Baylor College of Medicine Human Genome Sequencing Center using the Baylor pipeline method. "
}
```


```

{
    "source": "cbio",
    "type": "cnv",
    "collection": "paad_cnv_cbio_gistic",
    "sampleSize": 195,
    "GENETIC_ALTERATION_TYPE": "COPY_NUMBER_ALTERATION",
    "DATATYPE": "DISCRETE",
    "NAME": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 184 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification."
}
```


```

{
    "source": "cbio",
    "type": "mut",
    "collection": "paad_mut_cbio_mut",
    "sampleSize": 91,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "mut01",
    "collection": "paad_mut01_cbio_mut",
    "sampleSize": 91,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Binary mutation data from whole exome sequencing."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
paad_cnv_ucsc_gistic2thd | ucsc | cnv | 184 | TCGA pancreatic adenocarcinoma (PAAD) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
paad_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 131 | TCGA pancreatic adenocarcinoma (PAAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Baylor College of Medicine Human Genome Sequencing Center using the Baylor pipeline method. 
paad_cnv_cbio_gistic | cbio | cnv | 195 | Putative copy-number calls on 184 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.
paad_mut_cbio_mut | cbio | mut | 91 | Mutation data from whole exome sequencing.
paad_mut01_cbio_mut | cbio | mut01 | 91 | Binary mutation data from whole exome sequencing.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## PRAD - Prostate adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
prad_patient_tcga_clinical | clinical | TCGA | 
prad_drug_tcga_clinical | clinical | TCGA | 
prad_radiation_tcga_clinical | clinical | TCGA | 
prad_followup_tcga_v1p0 | clinical | TCGA | 
prad_newtumor_tcga_clinical | clinical | TCGA | 
prad_othermalignancy_tcga_v4p0 | clinical | TCGA | 
prad_mut_broad_mutsig2 | molecular | broad | mut
prad_mut01_broad_mutsig2 | molecular | broad | mut01
prad_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
prad_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
prad_cnv_cbio_gistic | molecular | cBio | cnv
prad_mut_cbio_mut | molecular | cBio | mut
prad_mut01_cbio_mut | molecular | cBio | mut01
prad_methylation_cbio_hm450 | molecular | cBio | methylation
prad_rna_cbio_agilent | molecular | cBio | rna
prad_protein_cbio_rppa | molecular | cBio | protein
prad_rna_ucsc_hiseq | molecular | ucsc | rna
prad_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "prad_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/PRAD/20141017/",
    "sampleSize": 492,
    "wrangler": "   cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA prostate adenocarcinoma (PRAD) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "prad_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": " https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/prad/gsc/broad.mit.edu/illuminaga_dnaseq_automated/mutations/",
    "sampleSize": 425,
    "wrangler": "cgData TCGAscript maf processed on 2015-01-27",
    "wranglingProcedure": "Download .maf file from TCGA DCC, processed into gene by sample matrix at UCSC, stored in the UCSC Xena repository",
    "description": "TCGA prostate adenocarcinoma (PRAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method."
}
```


```

{
    "source": "cbio",
    "type": "cnv",
    "collection": "prad_cnv_cbio_gistic",
    "sampleSize": 492,
    "GENETIC_ALTERATION_TYPE": "COPY_NUMBER_ALTERATION",
    "DATATYPE": "DISCRETE",
    "NAME": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 492 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification."
}
```


```

{
    "source": "cbio",
    "type": "mut",
    "collection": "prad_mut_cbio_mut",
    "sampleSize": 261,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "mut01",
    "collection": "prad_mut01_cbio_mut",
    "sampleSize": 261,
    "GENETIC_ALTERATION_TYPE": "MUTATION_EXTENDED",
    "DATATYPE": "MAF",
    "NAME": "Mutations",
    "description": "Binary mutation data from whole exome sequencing."
}
```


```

{
    "source": "cbio",
    "type": "protein",
    "collection": "prad_protein_cbio_rppa",
    "sampleSize": 164,
    "GENETIC_ALTERATION_TYPE": "PROTEIN_ARRAY_PROTEIN_LEVEL",
    "DATATYPE": "Z-SCORE",
    "NAME": "protein/phosphoprotein level (RPPA)",
    "description": "Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)"
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
prad_cnv_ucsc_gistic2thd | ucsc | cnv | 492 | TCGA prostate adenocarcinoma (PRAD) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
prad_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 425 | TCGA prostate adenocarcinoma (PRAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method.
prad_cnv_cbio_gistic | cbio | cnv | 492 | Putative copy-number calls on 492 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.
prad_mut_cbio_mut | cbio | mut | 261 | Mutation data from whole exome sequencing.
prad_mut01_cbio_mut | cbio | mut01 | 261 | Binary mutation data from whole exome sequencing.
prad_protein_cbio_rppa | cbio | protein | 164 | Protein or phosphoprotein level (Z-scores) measured by reverse phase protein array (RPPA)
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## SKCM - Skin Cutaneous Melanoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
skcm_drug_tcga_clinical | clinical | TCGA | 
skcm_followup_tcga_v2p0 | clinical | TCGA | 
skcm_newtumor_tcga_clinical | clinical | TCGA | 
skcm_othermalignancy_tcga_v4p0 | clinical | TCGA | 
skcm_patient_tcga_clinical | clinical | TCGA | 
skcm_radiation_tcga_clinical | clinical | TCGA | 
skcm_mut_broad_mutsig2 | molecular | broad | mut
skcm_mut01_broad_mutsig2 | molecular | broad | mut01
skcm_rna_ucsc_hiseq | molecular | ucsc | rna
skcm_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## STAD - Stomach adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
stad_drug_tcga_clinical | clinical | TCGA | 
stad_followup_tcga_v1p0 | clinical | TCGA | 
stad_newtumor_tcga_clinical | clinical | TCGA | 
stad_othermalignancy_tcga_v4p0 | clinical | TCGA | 
stad_patient_tcga_clinical | clinical | TCGA | 
stad_radiation_tcga_clinical | clinical | TCGA | 
stad_mut_broad_mutsig2 | molecular | broad | mut
stad_mut01_broad_mutsig2 | molecular | broad | mut01
stad_mut01_ucsc_mutationbcmgene | molecular | ucsc | mut01
stad_rna_ucsc_hiseq | molecular | ucsc | rna
stad_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "stad_mut01_ucsc_mutationbcmgene",
    "RawDataUrl": " https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/stad/gsc/hgsc.bcm.edu/illuminaga_dnaseq_automated/mutations/",
    "sampleSize": 379,
    "wrangler": "cgData TCGAscript maf processed on 2015-01-27",
    "wranglingProcedure": "Download .maf file from TCGA DCC, processed into gene by sample matrix at UCSC, stored in the UCSC Xena repository",
    "description": "TCGA stomach adenocarcinoma (STAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Baylor College of Medicine Human Genome Sequencing Center using the Baylor pipeline method. "
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
stad_mut01_ucsc_mutationbcmgene | ucsc | mut01 | 379 | TCGA stomach adenocarcinoma (STAD) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Baylor College of Medicine Human Genome Sequencing Center using the Baylor pipeline method. 
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## THCA - Thyroid carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
thca_drug_tcga_clinical | clinical | TCGA | 
thca_followup_tcga_v4p0 | clinical | TCGA | 
thca_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
thca_newtumor_tcga_clinical | clinical | TCGA | 
thca_othermalignancy_tcga_v4p0 | clinical | TCGA | 
thca_patient_tcga_clinical | clinical | TCGA | 
thca_radiation_tcga_clinical | clinical | TCGA | 
thca_mut_broad_mutsig2 | molecular | broad | mut
thca_mut01_broad_mutsig2 | molecular | broad | mut01
thca_rna_ucsc_hiseq | molecular | ucsc | rna
thca_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## UCEC - Uterine Corpus Endometrial Carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
ucec_drug_tcga_clinical | clinical | TCGA | 
ucec_followup_tcga_v2p0 | clinical | TCGA | 
ucec_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
ucec_newtumor_tcga_clinical | clinical | TCGA | 
ucec_othermalignancy_tcga_v4p0 | clinical | TCGA | 
ucec_patient_tcga_clinical | clinical | TCGA | 
ucec_radiation_tcga_clinical | clinical | TCGA | 
ucec_mut_broad_mutsig2 | molecular | broad | mut
ucec_mut01_broad_mutsig2 | molecular | broad | mut01
ucec_rna_ucsc_hiseq | molecular | ucsc | rna
ucec_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## ACC - Adrenocortical carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
acc_drug_tcga_clinical | clinical | TCGA | 
acc_followup_tcga_v4p0 | clinical | TCGA | 
acc_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
acc_newtumor_tcga_clinical | clinical | TCGA | 
acc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
acc_patient_tcga_clinical | clinical | TCGA | 
acc_radiation_tcga_clinical | clinical | TCGA | 
acc_mut_broad_mutsig2 | molecular | broad | mut
acc_mut01_broad_mutsig2 | molecular | broad | mut01
acc_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
acc_rna_ucsc_hiseq | molecular | ucsc | rna
acc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "acc_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/ACC/20141017/",
    "sampleSize": 90,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA adrenocortical carcinoma (ACC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
acc_cnv_ucsc_gistic2thd | ucsc | cnv | 90 | TCGA adrenocortical carcinoma (ACC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## BLCA - Bladder Urothelial Carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
blca_patient_tcga_clinical | clinical | TCGA | 
blca_drug_tcga_clinical | clinical | TCGA | 
blca_radiation_tcga_clinical | clinical | TCGA | 
blca_followup_tcga_v4p0 | clinical | TCGA | 
blca_newtumor_tcga_clinical | clinical | TCGA | 
blca_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
blca_othermalignancy_tcga_v4p0 | clinical | TCGA | 
blca_mut_broad_mutsig2 | molecular | broad | mut
blca_mut01_broad_mutsig2 | molecular | broad | mut01
blca_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
blca_mut01_ucsc_mutationbroadgene | molecular | ucsc | mut01
blca_rna_ucsc_hiseq | molecular | ucsc | rna
blca_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "blca_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/BLCA/20141017/",
    "sampleSize": 408,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA bladder urothelial carcinoma (BLCA) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "blca_mut01_ucsc_mutationbroadgene",
    "RawDataUrl": " https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/blca/gsc/broad.mit.edu/illuminaga_dnaseq_automated/mutations/",
    "sampleSize": 238,
    "wrangler": "cgData TCGAscript maf processed on 2015-01-27",
    "wranglingProcedure": "Download .maf file from TCGA DCC, processed into gene by sample matrix at UCSC, stored in the UCSC Xena repository",
    "description": "TCGA bladder urothelial carcinoma (BLCA) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method. "
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
blca_cnv_ucsc_gistic2thd | ucsc | cnv | 408 | TCGA bladder urothelial carcinoma (BLCA) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
blca_mut01_ucsc_mutationbroadgene | ucsc | mut01 | 238 | TCGA bladder urothelial carcinoma (BLCA) somatic mutation data. Sequencing data are generated on a IlluminaGA system. The calls are generated at Broad Institute Genome Sequencing Center using the MutDect method. 
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## CESC - Cervical squamous cell carcinoma and endocervical adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
cesc_drug_tcga_clinical | clinical | TCGA | 
cesc_followup_tcga_v4p0 | clinical | TCGA | 
cesc_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
cesc_newtumor_tcga_clinical | clinical | TCGA | 
cesc_othermalignancy_tcga_v4p0 | clinical | TCGA | 
cesc_patient_tcga_clinical | clinical | TCGA | 
cesc_radiation_tcga_clinical | clinical | TCGA | 
cesc_mut_broad_mutsig2 | molecular | broad | mut
cesc_mut01_broad_mutsig2 | molecular | broad | mut01
cesc_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
cesc_rna_ucsc_hiseq | molecular | ucsc | rna
cesc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "cesc_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/CESC/20141017/",
    "sampleSize": 295,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA cervical squamous cell carcinoma and endocervical adenocarcinoma (CESC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
cesc_cnv_ucsc_gistic2thd | ucsc | cnv | 295 | TCGA cervical squamous cell carcinoma and endocervical adenocarcinoma (CESC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## CHOL - Cholangiocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
chol_drug_tcga_clinical | clinical | TCGA | 
chol_followup_tcga_v4p0 | clinical | TCGA | 
chol_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
chol_newtumor_tcga_clinical | clinical | TCGA | 
chol_othermalignancy_tcga_v4p0 | clinical | TCGA | 
chol_patient_tcga_clinical | clinical | TCGA | 
chol_radiation_tcga_clinical | clinical | TCGA | 
chol_mut_broad_mutsig2 | molecular | broad | mut
chol_mut01_broad_mutsig2 | molecular | broad | mut01
chol_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
chol_rna_ucsc_hiseq | molecular | ucsc | rna
chol_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "chol_cnv_ucsc_gistic2thd",
    "RawDataUrl": " http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/CHOL/20141017/",
    "sampleSize": 36,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA cholangiocarcinoma (CHOL) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
chol_cnv_ucsc_gistic2thd | ucsc | cnv | 36 | TCGA cholangiocarcinoma (CHOL) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## DLBC - Lymphoid Neoplasm Diffuse Large B-cell Lymphoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
dlbc_drug_tcga_clinical | clinical | TCGA | 
dlbc_followup_tcga_v4p4 | clinical | TCGA | 
dlbc_newtumor-followup_tcga_v4p4 | clinical | TCGA | 
dlbc_newtumor_tcga_clinical | clinical | TCGA | 
dlbc_patient_tcga_clinical | clinical | TCGA | 
dlbc_radiation_tcga_clinical | clinical | TCGA | 
dlbc_mut_broad_mutsig2 | molecular | broad | mut
dlbc_mut01_broad_mutsig2 | molecular | broad | mut01
dlbc_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
dlbc_rna_ucsc_hiseq | molecular | ucsc | rna
dlbc_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "dlbc_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/DLBC/20141017/",
    "sampleSize": 48,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA lymphoid neoplasm diffuse large B-cell lymphoma (DLBC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
dlbc_cnv_ucsc_gistic2thd | ucsc | cnv | 48 | TCGA lymphoid neoplasm diffuse large B-cell lymphoma (DLBC) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## COADREAD - Colon adenocarcinoma & Rectum adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
coadread_events_tcga_clinical | clinical | TCGA | 
coadread_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
coadread_mut01_ucsc_mutation | molecular | ucsc | mut01
coadread_cnv_cbio_gistic | molecular | cBio | cnv
coadread_mut_cbio_mut | molecular | cBio | mut
coadread_mut01_cbio_mut | molecular | cBio | mut01
coadread_methylation_cbio_hm27 | molecular | cBio | methylation
coadread_methylation_cbio_hm450 | molecular | cBio | methylation
coadread_rna_cbio_agilent | molecular | cBio | rna
coadread_rna_cbio_seq | molecular | cBio | rna
coadread_protein_cbio_rppa | molecular | cBio | protein

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "coadread_cnv_ucsc_gistic2thd",
    "RawDataUrl": "",
    "sampleSize": 408,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": "The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "coadread_mut01_ucsc_mutation",
    "RawDataUrl": "https://www.synapse.org/#!Synapse:syn1729383",
    "sampleSize": 224,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": "TCGA colon & rectum adenocarcinoma (COADREAD) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample."
}
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
coadread_cnv_ucsc_gistic2thd | ucsc | cnv | 408 | The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample.
coadread_mut01_ucsc_mutation | ucsc | mut01 | 224 | TCGA colon & rectum adenocarcinoma (COADREAD) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample.

## LUNG - Lung adenocarcinoma & Lung squamous cell carcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
lung_events_tcga_clinical | clinical | TCGA | 
lung_facs_demo_flow | molecular | demo | facs
lung_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
lung_mut01_ucsc_mutation | molecular | ucsc | mut01
lung_cnv_cbio_gistic | molecular | cBio | cnv
lung_mut_cbio_mut | molecular | cBio | mut
lung_mut01_cbio_mut | molecular | cBio | mut01
lung_methylation_cbio_hm27 | molecular | cBio | methylation
lung_methylation_cbio_hm450 | molecular | cBio | methylation
lung_rna_cbio_agilent | molecular | cBio | rna
lung_rna_cbio_seq | molecular | cBio | rna
lung_rna_cbio_u133 | molecular | cBio | rna
lung_protein_cbio_rppa | molecular | cBio | protein
lung_rna_ucsc_hiseq | molecular | ucsc | rna

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "lung_cnv_ucsc_gistic2thd",
    "RawDataUrl": "",
    "sampleSize": 1016,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": "The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "lung_mut01_ucsc_mutation",
    "RawDataUrl": "",
    "sampleSize": 408,
    "wrangler": "",
    "wranglingProcedure": "",
    "description": "The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample."
}
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
lung_cnv_ucsc_gistic2thd | ucsc | cnv | 1016 | The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
lung_mut01_ucsc_mutation | ucsc | mut01 | 408 | The dataset is combined from TCGA lung squamous cell carcinoma and lung adenocarcinoma datasets. TCGA lung cancer (LUNG) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample.
undefined | undefined | undefined | undefined | undefined

## COAD - Colon adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
coad_patient_tcga_clinical | clinical | TCGA | 
coad_drug_tcga_clinical | clinical | TCGA | 
coad_radiation_tcga_clinical | clinical | TCGA | 
coad_followup_tcga_v1p0 | clinical | TCGA | 
coad_newtumor_tcga_clinical | clinical | TCGA | 
coad_newtumor-followup_tcga_v1p0 | clinical | TCGA | 
coad_othermalignancy_tcga_v4p0 | clinical | TCGA | 
coad_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined

## HG19 - Genome Platform

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
hg19_genesets_hgnc_import | category | hgnc | genesets
hg19_genesets_orghs_1e+05 | category | orgHs | genesets

### More Details of Molecular Collections

## LAML - Acute Myeloid Leukemia

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
laml_patient_tcga_clinical | clinical | TCGA | 
laml_cnv_ucsc_gistic2thd | molecular | ucsc | cnv
laml_mut01_ucsc_mutation | molecular | ucsc | mut01
laml_rna_ucsc_hiseq | molecular | ucsc | rna

### More Details of Molecular Collections

```

{
    "source": "ucsc",
    "type": "cnv",
    "collection": "laml_cnv_ucsc_gistic2thd",
    "RawDataUrl": "http://gdac.broadinstitute.org/runs/analyses__2014_10_17/data/LAML/20141017/",
    "sampleSize": 191,
    "wrangler": "cgData TCGAscript CopyNumber_Gistic2 processed on 2015-01-27",
    "wranglingProcedure": "FIREHOSE data download from TCGA DCC, processed at UCSC into cgData repository",
    "description": "TCGA acute myeloid leukemia (LAML) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method."
}
```


```

{
    "source": "ucsc",
    "type": "mut01",
    "collection": "laml_mut01_ucsc_mutation",
    "RawDataUrl": "https://www.synapse.org/#!Synapse:syn1729383",
    "sampleSize": 196,
    "wrangler": "cgData TCGAscript mutationMatrix processed on 2015-01-28",
    "wranglingProcedure": "TCGA PANCAN strictly filtered maf files (file names: *_cleaned_filtered.maf) download from Synapse, processed into gene by sample matrix at UCSC into cgData repository",
    "description": "TCGA acute myeloid leukemia (LAML) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample."
}
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
laml_cnv_ucsc_gistic2thd | ucsc | cnv | 191 | TCGA acute myeloid leukemia (LAML) thresholded gene-level copy number variation (CNV) estimated using the GISTIC2 method.
laml_mut01_ucsc_mutation | ucsc | mut01 | 196 | TCGA acute myeloid leukemia (LAML) somatic mutation data. Red (=1) indicates that a non-silent somatic mutation (nonsense, missense, frame-shif indels, splice site mutations, stop codon readthroughs) was identified in the protein coding region of a gene, or any mutation identified in a non-coding gene. White (=0) indicates that none of the above mutation calls were made in this gene for the specific sample.
undefined | undefined | undefined | undefined | undefined

## READ - Rectum adenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
read_patient_tcga_clinical | clinical | TCGA | 
read_drug_tcga_clinical | clinical | TCGA | 
read_radiation_tcga_clinical | clinical | TCGA | 
read_followup_tcga_v1p0 | clinical | TCGA | 
read_newtumor_tcga_clinical | clinical | TCGA | 
read_newtumor-followup_tcga_v1p0 | clinical | TCGA | 
read_othermalignancy_tcga_v4p0 | clinical | TCGA | 
read_protein_ucsc_rppa | molecular | ucsc | protein
read_rna_ucsc_hiseq | molecular | ucsc | rna

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## UCS - Uterine Carcinosarcoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
ucs_drug_tcga_clinical | clinical | TCGA | 
ucs_followup_tcga_v4p0 | clinical | TCGA | 
ucs_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
ucs_newtumor_tcga_clinical | clinical | TCGA | 
ucs_othermalignancy_tcga_v4p0 | clinical | TCGA | 
ucs_patient_tcga_clinical | clinical | TCGA | 
ucs_radiation_tcga_clinical | clinical | TCGA | 
ucs_rna_ucsc_hiseq | molecular | ucsc | rna
ucs_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## UVM - Uveal Melanoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
uvm_drug_tcga_clinical | clinical | TCGA | 
uvm_followup_tcga_v4p0 | clinical | TCGA | 
uvm_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
uvm_newtumor_tcga_clinical | clinical | TCGA | 
uvm_othermalignancy_tcga_v4p0 | clinical | TCGA | 
uvm_patient_tcga_clinical | clinical | TCGA | 
uvm_radiation_tcga_clinical | clinical | TCGA | 
uvm_rna_ucsc_hiseq | molecular | ucsc | rna
uvm_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## THYM - Thymoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
thym_drug_tcga_clinical | clinical | TCGA | 
thym_followup_tcga_v4p0 | clinical | TCGA | 
thym_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
thym_newtumor_tcga_clinical | clinical | TCGA | 
thym_othermalignancy_tcga_v4p0 | clinical | TCGA | 
thym_patient_tcga_clinical | clinical | TCGA | 
thym_radiation_tcga_clinical | clinical | TCGA | 
thym_rna_ucsc_hiseq | molecular | ucsc | rna
thym_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## TGCT - Testicular Germ Cell Tumors

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
tgct_drug_tcga_clinical | clinical | TCGA | 
tgct_followup_tcga_v4p0 | clinical | TCGA | 
tgct_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
tgct_newtumor_tcga_clinical | clinical | TCGA | 
tgct_othermalignancy_tcga_v4p0 | clinical | TCGA | 
tgct_patient_tcga_clinical | clinical | TCGA | 
tgct_radiation_tcga_clinical | clinical | TCGA | 
tgct_rna_ucsc_hiseq | molecular | ucsc | rna
tgct_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## PCPG - Pheochromocytoma and Paraganglioma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
pcpg_drug_tcga_clinical | clinical | TCGA | 
pcpg_followup_tcga_v4p0 | clinical | TCGA | 
pcpg_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
pcpg_newtumor_tcga_clinical | clinical | TCGA | 
pcpg_othermalignancy_tcga_v4p0 | clinical | TCGA | 
pcpg_patient_tcga_clinical | clinical | TCGA | 
pcpg_radiation_tcga_clinical | clinical | TCGA | 
pcpg_rna_ucsc_hiseq | molecular | ucsc | rna
pcpg_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## OV - Ovarian serous cystadenocarcinoma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
ov_drug_tcga_clinical | clinical | TCGA | 
ov_followup_tcga_v1p0 | clinical | TCGA | 
ov_newtumor-followup_tcga_v1p0 | clinical | TCGA | 
ov_newtumor_tcga_clinical | clinical | TCGA | 
ov_othermalignancy_tcga_v4p0 | clinical | TCGA | 
ov_patient_tcga_clinical | clinical | TCGA | 
ov_radiation_tcga_clinical | clinical | TCGA | 
ov_rna_ucsc_hiseq | molecular | ucsc | rna
ov_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined

## MESO - Mesothelioma

Collection Name | Collection Type | Data Source | Data Type
--------- | ----------- | ----------- | -----------
meso_drug_tcga_clinical | clinical | TCGA | 
meso_followup_tcga_v4p0 | clinical | TCGA | 
meso_newtumor-followup_tcga_v4p0 | clinical | TCGA | 
meso_newtumor_tcga_clinical | clinical | TCGA | 
meso_othermalignancy_tcga_v4p0 | clinical | TCGA | 
meso_patient_tcga_clinical | clinical | TCGA | 
meso_radiation_tcga_clinical | clinical | TCGA | 
meso_rna_ucsc_hiseq | molecular | ucsc | rna
meso_protein_ucsc_rppa | molecular | ucsc | protein

### More Details of Molecular Collections

```

false
```


```

false
```


Collection | Data Source | Data Type | Size | Description
--------- | ----------- | ----------- | ----------- | -----------
undefined | undefined | undefined | undefined | undefined
undefined | undefined | undefined | undefined | undefined
