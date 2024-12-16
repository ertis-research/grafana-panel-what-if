# What-If Analysis of ML models for Grafana

![what-if-provisional](https://github.com/ertis-research/whatif-panel-for-Grafana/assets/48439828/852ab329-8012-4ad8-9c3d-1bf7bfbc8f46)

<div align="center">
  
![Grafana 8.5.3](https://img.shields.io/badge/Grafana-8.0.0-orange)
![Grafana 9.5.1](https://img.shields.io/badge/Grafana-9.0.0-orange)
![GitHub watchers](https://img.shields.io/github/watchers/ertis-research/whatif-panel-for-Grafana)
![GitHub Repo stars](https://img.shields.io/github/stars/ertis-research/whatif-panel-for-Grafana)

</div>

This Grafana panel is a powerful tool for conducting **What-If predictive analysis with Artificial Intelligence models**, with a special focus on **Machine Learning**. Currently, the panel is compatible with **AI/ML models that receive a list of numeric fields through an HTTP request**.

The tool enables easy loading of data into the model directly from a data source configured in Grafana. It allows direct modifications to the data or through value intervals and presents the results in a pleasant and easily interpretable manner, using interactive graphs when necessary. Additionally, it provides the capability to export and import both the data and the obtained results.

Also we have made every effort to design the panel to be abstract and intuitive, while ensuring it is responsive to panel size and consistent with both dark and light modes. We hope you like it!

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Getting started](#getting-started)
- [Documentation](#documentation)
   - [Panel usage](#panel-usage)
      - [Data collections](#data-collections)
      - [Tag filtering and sorting](#tag-filtering-and-sorting)
      - [Interval behaviour](#interval-behaviour)
      - [Understanding the comparative graph](#understanding-the-comparative-graph)
      - [Extra information about models](#extra-information-about-models)
      - [Extra calculation using models](#extra-calculation-using-models)
      - [CSV import/export](#csv-importexport)
      - [Lack of data](#lack-of-data)
   - [Configuration](#configuration)
      - [Basic options](#basic-options)
      - [Models](#models)
      - [Formats](#formats)
      - [Data import queries](#data-import-queries)
      - [Extra information](#extra-information)
      - [Extra calculation](#extra-calculation)
- [Build from source](#build-from-source)
  - [Development mode](#development-mode)
  - [Production mode](#production-mode)

## Requirements

- [Grafana](https://grafana.com/) - minimum is version 8, but version 9 is recommended (v8.5.3 and v9.5.1 has been used for development)

## Installation

To install the plugin, first place the compiled code in the [Grafana plugins directory](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins) which is _/var/lib/grafana/plugins_ by default. Next, add its identifier (`ertis-whatif-panel`) to the `allow_loading_unsigned_plugins`  list in your Grafana configuration file. Finally, restart Grafana to apply the changes. The following steps provide guidance for both local and Helm installations, though it can be installed to any Grafana distribution.

### Local

You must first download the zip file of the [latest release](https://github.com/ertis-research/grafana-panel-what-if/releases/tag/latest). If you prefer or need to make modifications, you can also built it yourself by following the instructions in the [related section](#build-from-source). Then access the Grafana folder on your PC. In this folder you have to find the [Grafana configuration file](https://grafana.com/docs/grafana/v9.5/setup-grafana/configure-grafana). Follow the [Grafana documentation](https://grafana.com/docs/grafana/v9.5/setup-grafana/configure-grafana/#configuration-file-location) to know its location, the name of the file and how to modify it. When you have it, modify the appropriate file by uncommenting and adding the following:

```ini
[plugins]
# Enter a comma-separated list of plugin identifiers to identify plugins to load even if they are unsigned. Plugins with modified signatures are never loaded.
allow_loading_unsigned_plugins = ertis-whatif-panel
```

In the same file, check the [path to the plugins folder](https://grafana.com/docs/grafana/v9.5/setup-grafana/configure-grafana/#plugins). You can modify it if you consider it convenient. Then, go to that folder and unzip the plugin zip file. You should get a folder with the name "ertis-whatif-panel" which must have something like this inside (make sure that there are no intermediate folders).

<p align="center">
<img
    src="https://github.com/user-attachments/assets/feda3082-dcda-4917-b6f6-ba146ea07998"
    alt="Kubectl get services"
    width="200"
/>
</p>

For the changes to take effect, **Grafana must be restarted**. Please refer to [its documentation](https://grafana.com/docs/grafana/v9.5/setup-grafana/start-restart-grafana/) to find out how to do this depending on your operating system.

**The plugin should now be available for adding it to a dashboard.**

### Helm

For this case you need to add an extraInitContainer to your _values.yaml_, where you navigate to the plugins folder, download the zip of the latest release and unzip it.
Below is what you need to add.

```yaml title=values.yaml
extraInitContainers:
- name: install-whatif-plugin
  image: busybox
  command:
    - /bin/sh
    - -c
    - |
      #!/bin/sh
      set -euo pipefail
      mkdir -p /grafana-storage/plugins
      cd /grafana-storage/plugins
      wget --no-check-certificate -O ertis-whatif-panel.zip https://github.com/ertis-research/grafana-panel-what-if/releases/download/latest/ertis-whatif-panel.zip
      unzip -o ertis-whatif-panel.zip
      rm ertis-whatif-panel.zip
  volumeMounts:
  - name: storage
    mountPath: /grafana-storage
``` 

At the moment the plugin is not signed, so you will have to add the plugin id (`ertis-whatif-panel`) to the list of unsigned plugins, which is also defined inside the values.yaml. This will allow Grafana to show it as an plugin (if not, it will not appear at all). Below is what you need to add to your _values.yaml_:

```yaml title=values.yaml
grafana.ini:
  plugins:
    allow_loading_unsigned_plugins: ertis-whatif-panel
``` 

Now update the Grafana helm: 

```bash
helm upgrade <your-release-name> grafana/grafana -f values.yaml
```

Verify that the Grafana pod is in Running and Ready status.

**The plugin should now be available for adding it to a dashboard.**

## Getting started

> [!NOTE]
> This explanation is simplified for common users and assumes that the plugin has already been added and correctly [configured](#configuration) with the necessary AI/ML models. For more detailed information, it is recommended to consult the rest of the [documentation](#documentation) provided.

The functionality of the plugin is divided into 5 steps:

#### Step 1: Select model

To begin, the AI/ML model to be used to perform the analysis must be selected. Once chosen, the tags associated with that model will be displayed in step 3. **Although the tool can apply multiple data collections, all of them will use the same model to make predictions**.

#### Step 2: Import data

Several options are provided for entering model tag data. You can select a **specific date and time**, **upload a CSV file**, or **use a variable from the Grafana dashboard** (in particular, [*from* and *to*](https://grafana.com/docs/grafana/latest/dashboards/variables/add-template-variables/#__from-and-__to)). Adding data in any of these ways will create a new collection in the drop-down menu and display the imported values in their respective tags. It is possible to add multiple collections of data (no limit set), even if they correspond to the same datetime.

#### Step 3: Modify data

At this point, it is possible to modify the values of the tags whose variation is to be analysed. To accomplish this, there are 3 options available:

- **Modify values directly:** Each tag consists of two fields: the left one shows the value obtained when importing the data, while the right one is initially empty. If the right field is filled in, the prediction will consider this as the new value of the tag. We can modify as many tags as we want in this way and **the prediction will be done jointly**, i.e. assuming the change of all of them at the same time in the same prediction. In case you are working with a model that receives a list of values, the left field will show the mean of all of them and the new value entered will be considered the new mean. The tool will automatically obtain a new list of values with respect to the new mean according to the weight that each value had in the original mean.

- **Use intervals:** When a [interval](#interval-behaviour) of values has been correctly indicated, the checkbox to the right of the second field of each tag will be enabled. By ticking this box, you indicate your wish to analyse that tag with respect to the set range. It is possible to analyse more than one tag for comparison purposes. During the prediction, the values within the range will be applied, **in isolation**, to each selected tag, keeping the original value of the rest of the selected tags.

- **Merging other two options:** If modifications are made directly to some values and a interval is applied to other tags, the prediction modified by the **direct values shall be considered as the basis for the application of the interval**. This means that the modified values of the tags will be taken into account instead of the original values during the analysis of each tag with respect to the indicated interval. On the other hand, if a new value is assigned to a tag and at the same time it is selected for analysis with respect to the interval, the new value will not be taken into account in no case.

In addition, a series of [filters](#tag-filtering-and-sorting) have been enabled to facilitate the search and modification of the desired tags.

#### Step 4: Predict result

In case you have configured extra information for the selected model, this will be displayed in a section within this step after the data import, as long as you have obtained some information from the assigned query.

Once you have modified the data you want to analyse, click on the *predict all* button. This will **run the predictions for all data collections simultaneously** and display the results just below.

Results may include:

- **Original value:** This value will appear as long as there is no missing data in the original data collection. It represents the prediction for the data collection without considering any modifications.
- **New value:** This value will appear when at least one tag has a directly modified value. It represents the prediction for the data collection in which the original values are replaced by new values, in the tags where they exist. If there is any tag marked to be analysed by an interval, the corresponding original value will be considered.
- **Comparative graph:** This [graph](#understanding-the-comparative-graph) will appear when the interval is active and there is at least one tag with the box ticked for interval analysis. Each line of the graph will represent the predicted values obtained by considering, individually for each tag, the values within the range instead of their original value.

In case you want to modify the data again, you need to click on the red *Modify data again* button located where the predict button used to be. This will discard all results and allow rewriting in any of the available data collections, keeping the modifications previously indicated.

#### Step 5: Export data (optional)

This step allows you to export the information contained in the panel in order to be able to [import it](#csv-importexport) later or to perform a more exhaustive analysis with other types of tools. This button will only export data from the current data collection and not from all existing data collections.

The export button will be available from step 3 onwards, where it will be possible to download a [CSV](#csv-scheme) with the interval configuration if active, the original and new value (if any) of each tag and whether or not the tag is marked for interval analysis. After executing step 4, the result for the different predictions will be added to this information.

## Documentation

### Panel usage

#### Data collections

A data collection in the tool corresponds to a **set of original values, new values, interval data and extra information**. The tool is able to **handle more than one data collection** in order to facilitate comparison between the model output for different modifications. 

When predicting, the same model (selected in [step 1](#step-1-select-model)) shall be applied to all data collections **at the same time**. If data is missing from any of the collections, no collection will be predicted until it is resolved.

To change the active data collection, a selector is provided at the top of the tool. Switching data collections means that data from the newly selected collection will be displayed, keeping only the filter status (the interval definition is also part of the data collection).

On the other hand, data collections are identified by the origin of the data (*DateTime/CSV*) and the value entered in the import (the date or the file name).

To delete the active data collection, click on the red button with the bin icon to the right of the selector. Two buttons will appear to confirm the deletion (*Delete*) or cancel it (*Cancel*). **In case of deletion, this action cannot be undone.**

#### Tag filtering and sorting

When modifying data ([step 3](#step-3-modify-data)) the list of tags can be filtered to make it easier to find the tags whose value you want to change. There are two possible filtering modes **that overlap each other**:

- **Order and distinction by category:** In the configuration of the tags used by the model, it is possible to define a category and a priority for each tag. The distribution and order of the tags will depend on the *Show categories* switch.
  - If *enabled*, tags will be grouped by category and ordered within each group from highest to lowest priority. 
  - If *deactivated*, tags will not be grouped and will be sorted from highest to lowest priority taking into account all tags.
- **Search by text:** Just below the range definition, there is a search field where it is possible to enter text. When you do so, the tags displayed will be automatically filtered by **those whose identifier or description contains this text without distinguishing between upper and lower case**.

#### Interval behaviour

To define a range, the minimum (*min*), maximum (*max*) and *steps* fields at the top of [step 3](#step-3-modify-data) must be filled in. The minimum and maximum fields can take either positive or negative values and the minimum value must be less than or equal to the maximum value. The steps can only be positive and indicate the numerical difference to be considered within the numbers in the range, taking into account that the **extremes are always included**. 

For example, for an interval with minimum -2 and maximum 2 with steps of 1, the values -2, -1, 0, 1 and 2 shall be considered. If the division between the steps is not exact, counting shall start from the minimum and the maximum extreme shall be included. For example, for an interval with minimum -2 and maximum 3 with steps of 2, the values -2, 0, 2 and 3 shall be considered.

The values of the interval will be applied to the original value by subtracting or adding as absolute values or percentages of it, as defined with the *Type* switch (blue indicates the selected option). In case of working with a model that receives a list of values, the mean of these values will be considered as the original value. In particular:

- If the **percentages** (*%*) option is selected, the values shall be considered as percentages of the original value. If the percentage is negative it will be subtracted from the original value, while if it is positive it will be added.

  For example, if the interval gives -2, -1, 0, 1 and 2 and the original value of the selected tag is 10, the values 9.8, 9.9, 10, 10.1 and 10.2 will be considered. 
- If the **absolute values** option (*Abs.*) is selected, the values will be considered without taking into account the original value, subtracting if it is negative and adding if it is positive.

  For example, if the interval gives -2, -1, 0, 1 and 2 and the original value of the selected tag is 10, the values 8, 9, 10, 11 and 12 will be considered.

When the interval is well defined, **its indicator will turn from red to green** and the boxes next to the values of each tag will be enabled. At this point, **one or more tags can be selected for analysis** with respect to the interval. If after the selection of tags the interval is deconfigured, the boxes will not be disabled and those selected will not be taken into account.

#### Understanding the comparative graph

The graph appears when predicting the results ([step 4](#step-4-predict-result)) when an interval (min ≥ max) is correctly defined and at least one tag is selected for analysis. 

The X axis of the graph indicates the value subtracted or added to the original value of the tag, while the Y axis corresponds to the value returned by the prediction. The points that make up the lines are the predictions that have been made with the different values of the tag. In addition, each point not only indicates the pair (X, Y) to which it belongs but also the **specific value applied to that tag during the prediction**. In case you are working with lists of values, this value will correspond to the mean of them.

At the bottom, the legend of the graph is shown, indicating the colour of the line corresponding to each selected tag. 
- If you click *only once on one of the tags*, it will be shown or hidden from the graph. 
- If you click *twice in a row on one of the tags*, only its line will be shown on the graph, hiding all the others. Clicking again on the same tag will show all the available lines.

You can also interact with the graph through the tools provided by [Plotly](https://plotly.com/javascript/), which are displayed in the upper right corner of the graph. In order of appearance from left to right, the tools are:
- **Zoom**: By clicking somewhere on the graph and dragging the mouse, the view zooms in on the selected box.
- **Pan**: Allows you to move around the graph.
- **Box select**: Allows you to draw a box on the graph.
- **Lasso select**: Allows you to draw a custom shape on the graph.
- **Zoom in**: Zooms in on the graph.
- **Zoom out**: Zoom out the view of the graph.
- **Autoscale**: Modifies the view to show all points on the graph.
- **Reset axes**: Returns the graph to its original view.
- **Download plot as png**: Allows you to download the graph in PNG format. Clicking the button will open a new tab with the generated image. To download it, right click on the image and select *Save image as*.

#### Extra information about models

Some model information can be added in the tool to support the understanding of the prediction results. If [configured](#extra-information), this data will be displayed under the predict button in [step 4](#step-4-predict-result) and will appear from the data import onwards (it can be consulted while modifying the tag values). This section can be minimised at any time with the arrow to the left of the title.

The information displayed will depend on the amount of information received by the query:
- If the query **does not return any data** or the extra information has not been configured correctly, the extra information section will not appear.
- If the query **returns one or two pieces of information**, these will be displayed in the section itself.
- If the query **returns more than two pieces of information**, the first two will be displayed in the section itself, while you will have to click on the *See more* button to see the rest. This will display a dialogue window with all available information. To close it you can use the *X* in the top right corner or click anywhere on the page outside the dialogue window.

#### Extra calculation using models

An extra calculation can be added to use the model and the data collection, providing a useful result for analysis. If [configured](#extra-calculation), a new button will appear below the predict button in [step 4](#step-4-predict-result) and above any extra information, if present. This calculation will include, at a minimum, a button with the assigned name, and may include various fields for parameters that must be filled before executing the calculation. There are three types of fields the calculation may request:

- **Text field**: Allows entry of any text without letter restrictions.
- **Number field**: Allows entry of any number, whether integer or decimal, using a period as the decimal separator.
- **Date field**: When clicked, a date picker appears, allowing selection of any date, past or future. Once selected, the date will be displayed in the user’s regional format.

Once the calculation is executed, the result will appear in the same section as the usual What-If result. If the What-If analysis is run either before or after the extra calculation, a tab selection will appear at the top of the results to easily switch between both results. The results section for the additional calculation includes a main conclusion and a subtitle with further relevant information (either dynamic or static). Additionally, a [graph](#understanding-the-comparative-graph) similar to the one in the standard analysis will be displayed, reflecting the model requests made to complete the calculation.

#### CSV import/export

The data entered in the application and the results obtained can be exported in CSV format for further analysis with other tools or for importing into the application. This import can be useful if you want to continue an ongoing analysis or modify a previous study.

##### CSV file schema

The CSV file may start with two optional comments (preceded by #) which could be in any order. These are:
- The comment starting with **DateTime** indicates the time instant for which this data has been obtained.
- The comment starting with **Interval** indicates the interval that has been defined in the tool. It will only appear if the interval is completely set (its indicator is green).
 
After the comments, the first row marks the name of the CSV columns. The first column is ID, whose values will be used as row identifiers. Except for this and the *_RESULT* column, the rest will correspond to all the tags that enter the model, ordered in such a way that first those that have been modified with a fixed value are shown, then those that have been selected for analysis with interval, and then the rest of the tags. If the model input is a list of values for each tag, all the values contained in the list will be indicated in their respective field separated by commas.

On the other hand, except for the one identified with *_INTERVAL*, each row will correspond to a different prediction made to the model. The main ones are:

- **DEFAULT_VALUE**: These are the real values of the tags that enter the model. In the tool they correspond to those obtained from the Grafana query during the data import.
- **NEW_VALUE**: These are the values that have been modified directly, without using intervals.

Predictions for interval analysis are identified in the row with the tag that has been considered and the change that has been applied to its original value (e.g. *ID_TAG_1 - 2%*). All rows will show only the values used that are different from the original prediction. This will allow to easily distinguish which data has been modified from the default prediction. 

The *_INTERVAL* row marks the tags that have been selected for interval analysis (*YES* for enabled, *NO* for disabled).

Finally, the *_RESULT* column **will only appear if the data with the results are downloaded**. It will indicate the result of the prediction for the row data.

##### Export

To export the data as CSV, simply click on the download button in [step 5](#step-5-export-data-optional). This will return more or less information depending on which step the application is in.

- If the **data are being modified** ([step 3](#step-3-modify-data)), the default values imported from Grafana, the new modified values directly and the data with respect to the interval will be exported.
- If the **results have been predicted** ([step 4](#step-4-predict-result)), the same data will be exported as in the previous step, but adding the predicted values and, if available, the different predictions of the interval analysis.

##### Import

To import the CSV into the tool, select the **CSV option** in the selector of the data import section ([step 2](#step-2-import-data)). This will display an *Upload file* button which, when clicked, will display a file window where a file in CSV format can be selected. The name of the selected file will be displayed next to the button. 

By clicking on the *Add data* button the file will be processed and its data will be loaded into the tool as a new data collection. It is possible to add the same file as many times as necessary. In case of non-compliance with the indicated scheme, the tool will indicate that the file could not be processed correctly and no collection will be added.

#### Lack of data

After importing data from [step 2](#step-2-import-data), it is possible that data for some tags may be missing. Tags with no original value will be marked with the description in red. In order to predict the data collection, it **will be mandatory to fill in the new value field for these tags**. Once the field is filled in, the description of the tag will change to its default colour.

In case of missing data is **not corrected** for all tags, when predicting, a message will appear in the upper right corner indicating the affected tags and the identifier of the collection that contains them.

In case the missing data is **corrected** for all affected tags, the prediction should be able to run without problems. The results differ in that no original value is displayed, but only the new predicted value and, if applicable, the graph.

### Configuration

#### Basic options

In the general tab, you will find the options that are common to the whole panel. Specifically, they are the following:

- **Plugin language:** It is possible to change the language of the elements that make up the panel to English or Spanish. The default value is English. This will not affect the configuration section.

#### Models
> [!WARNING]
> At least one AI/ML model must be configured in order to use the panel.

In the Models tab, the list of models already configured (if any) and a section with the blue text to add a new one (_Add new model_) are displayed. This will always appear last in the list, after all the configured models. Clicking on any of these elements will display a form whose content will vary depending on whether it is a configured model or the section for adding a new model.

##### Adding a new model
Clicking on the _Add new model_ section will display a blank form that allows you to define a new model. 

The basic configuration of the model has the following fields:
- **ID** (required): Identifier of the model (it will be shown as main text in the selector of [step 1](#step-1-select-model)).
- **Description** (optional): Description of the model to facilitate its identification by the users (it will be shown under the identifier in the selector of [step 1](#step-1-select-model)).
- **Format** (required): Formats used by the model to process its input and output data. The available options will be those configured in the [corresponding section](#formats).
- **Decimals:** Defines the number of decimals to which the prediction results will be rounded. This rounding will not be applied for the prediction or export, but will only be visual when displaying the results both individually and in the graph.
- **Extra calculation**: Identifier for an additional calculation that can be executed using model data to obtain information that enhances the analysis. Refer to the [corresponding section](#extra-calculations) for more information.

Next, you will be able to configure the model queries, which will allow you to add data directly from Grafana. Check their configuration in the [corresponding section](#data-import-queries).

Regarding the connection to the model, this shall be done through HTTP and it shall be possible to add basic authentication. The fields to be filled in are the following:
- **Method** (required): Method to be used for the HTTP request. The available values are POST, GET, PUT and PATCH.
- **URL** (required): URL address where the model expects to receive the input data.
- **Username** (optional): Username for basic authentication.
- **Password** (optional): Password for basic authentication.

You must then configure the [list of tags](#list-of-tags) for the model. 

Optionally, you can preprocess the data before invoking the model, by applying scaling and/or executing JavaScript code. For more details, see the [corresponding section](#pre-processing-and-scaling-of-input-data).

##### Delete and edit models
For an already configured model, the form will be displayed filled with the model data. The fields will be disabled to prevent unwanted editing.

If you want to **delete the model**, click on the red button with the bin icon. When you press it, a confirmation will appear allowing you to cancel this action (_Cancel_ button, the model will not be deleted) or to confirm it (_Delete_ button, the model will be deleted). **If the panel is deleted and saved, this action cannot be undone**.

If you want to **edit the model**, it will be necessary to click on the blue _Edit_ button. By doing so, the fields of the model form will be enabled, making it possible to modify their values. At this point, the information can be modified in the same way as in the creation form. The edit mode will be terminated by clicking on one of the two buttons at the bottom: 
- _Cancel_ button: The changes made will be discarded, returning the model to its previous state. 
- _Save model_ button: The changes made to the model will be saved. These changes can be used in the preview, but **to save them definitively you must also save the changes in the Grafana panel**.

##### List of tags
To define the list of tags that enter the model, the section entitled _Model input tags_ must be expanded. Here you can add as many tags as the model requires (there is no limit). 
The list can be viewed in two ways: as a form or as JSON format. To switch from one mode to the other, use the switch in the top left corner. Both modes will display the same data at any time. The form mode allows you to add tags easily, while the JSON mode is very useful if you want to copy the tag list from another model or automate the creation of the tag list if it is very large.

Each tag can have the following information:
- **ID** (required): Identifier of the tag.
- **Category** (optional): Category of the tag. It allows to group the different tags in categories to find them easily when modifying ([step 3](#step-3-modify-data)). This field is case sensitive. The same text must be entered in those tags that will belong to the same category. The default category is default.
- **Priority** (optional): Numeric field indicating the importance of the tag. It is used to order the tags according to the user's preference, taking into account that the tags will be displayed from highest to lowest priority. This order is only visual, **when sending the data to the model they will keep the position given in the configuration**.
- **Description** (optional): Description of the tag. It is shown next to the identifier in [step 3](#step-3-modify-data) and allows to describe the tag with a more natural name.

##### Pre-processing and scaling of input data

Before sending the data to the model, it is possible to apply some [pre-processing](https://scikit-learn.org/stable/modules/preprocessing.html#preprocessing-data) to it. In particular, it is supported to apply a JavaScript code block and to apply scaling. **Neither is required and if both are defined, the JavaScript code will be applied first, followed by the scaling**.

The JavaScript code must be included in the _Pre-process_ field and allows you to **perform preprocessing before sending the data to the model**. For example, it can be useful if one of the inputs of the model is the sum of several tags or if you want to modify the order of the list.
This block will be executed in an sandbox and will receive as input a JSON object called _data_ whose key-value pairs will correspond to the identifier of each tag and the list of its values to send to the model respectively. The output of the code should also be a _data_ object following the same scheme. For example, if the model had 3 tags and used 2 values for each tag, the _data_ object both as input and output could correspond to:

```json
{
  "tag1": [0.43, 0.32],
  "tag2": [0.23, 0.54],
  "tag3": [0.10, 0.90]
}
```

Taking into account the input and output, the code offers the freedom to define as many functions and variables as necessary to obtain the list of values to be sent to the model. Since the code runs in an isolated environment, **no import of libraries is allowed**. An example of JavaScript code to preprocess the input data would be the following (not including the content of the functions _parse_to_ratios_, _get_used_filter_vars_ and _order_ which would also be defined in the same place):

<p align="center">
  <img src="https://github.com/ertis-research/whatif-panel-for-Grafana/assets/48439828/5d30f1b7-172c-4255-a84e-a6bf72295569" />
</p>

As for the scaling (_Scaler_ field), this is equivalent to the standard scaling (_StandardScaler_ in sklearn) which uses the mean and standard deviation obtained from the training data of the model. This data will be defined by means of a JSON object with a _mean_ key for the mean and a _scale_ key for the standard deviation, whose values are numeric lists of length equal to the number of tags that the model must receive. The scheme is as follows:

```json
{
  mean: number[],
  scale: number[]
}
```

With this data the following formula shall be applied, where _data_ is the list of raw tag values to be sent to the model and _res_ the list with the resulting values to be sent to the model. This formula consists of obtaining a new list of values by subtracting from each value in the original list the value of mean in the same position and dividing the result by the value of scale in the same position.

<p align="center">
  <img src="https://github.com/ertis-research/whatif-panel-for-Grafana/assets/48439828/0f078160-817b-4c0f-aa51-5639b088c8cf" />
</p>

This formula obtains a new list of data by subtracting for each tag in the original list the value of mean at its same position and dividing the result by the value of scale at the same position. This is applied to each of the values that are related to each tag. For example, if we have in the second position of the _mean_ and _scale_ list the values 1 and 2, respectively, and in the second position of the data list the _TAG_ tag with a list of values [7, 7, 9], then in the new data list the values of the _TAG_ tag would be [3, 3, 4].

#### Formats

The IA/ML models will receive the list of values to predict within one schema and send the prediction result within another. These formats may coincide for several models, as they mainly depend on the service where they are hosted.

The _Formats_ tab shows the list of defined formats (if any) and a section with blue text to add a new one (_Add new format_). This will always appear last in the list, after all the formats configured. Clicking on any of these elements will display a form that will be filled in if it is a defined format or empty if a new format is to be added.

In case of an already configured format, editing and deleting will be allowed following the [same logic as the model creation form](#delete-and-edit-models).

This form consists of 3 fields:
- **ID** (required): Identifier of the format. It will be shown in the format selector in the model configuration.
- **Input** (required): Format in which the list of tag values must be mapped just before being sent to the model. This can correspond to any text, although typically it will be a JSON object. The variable $input is used to mark where the list of values should be added, which will be replaced by before sending:
  - If **only one** dataset is predicted, by a numeric list with the tag values separated by commas and enclosed in square brackets (e.g.: [0.43, 0.23, 0.10]).
  - If **multiple** datasets are predicted, by the above representation for each set enclosed in commas and without square brackets (e.g. [0.43, 0.23, 0.10], [0.35, 0.33, 0.21]).
- **Output** (required): Format from which the prediction result of the model will be extracted. This can correspond to any text, although it will typically be a JSON object. The $output variable is used to mark which part of the response corresponds to the prediction. When processing the received response, the corresponding part of the message will be extracted and this text will be separated by commas in case more than one prediction has been requested. From these texts, the numerical value they contain will be extracted, which will be the results of the predictions requested.

An example of a configured format is as follows:

<p align="center">
  <img src="https://github.com/ertis-research/whatif-panel-for-Grafana/assets/48439828/4217c1ea-6921-4219-aebc-bdee8632b2bb" />
</p>

#### Data import queries

The values of the tags of the model can be imported directly from one of the data sources configured in Grafana. To do this, a query must be constructed which, taking into account the list of tags in the model, performs the necessary calculations to obtain the input values at a specific time instant. This must return a table that relates each tag with to at least one value. For example, a possible result would be:

This query must be defined within the corresponding section (_query_) after selecting the appropriate data source. Once configured, it can be assigned to the models that use it within their specific configuration.

In order to use the configured tag list and consider the time instant given by the user in the _Set datetime_ section, the query must include [dashboard variables](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/). These variables must be created in the dashboard configuration (not the panel configuration) and assigned in the corresponding fields of the _Model queries_ section within the configuration of each model. Different models can have the same variables assigned without any problem, the important thing is that these variables correspond to the variables used by the selected query.

- **Variable tags** (required): Dashboard variable to be replaced by the list of tags of the model. Within the query, this variable must be added where the list of identifiers from which information will be extracted is indicated.
- **Quotes for list** (required): Format to be used for the list of tags of the model when it is replaced in the query. This will correspond to the identifiers of the list separated by inverted commas, being able to choose that each one is contained between double, single or none.
- **Variable time** (required): Table variable to be replaced by the time instant in ISO 8601 UTC (e.g. 2023-03-01T13:46:58Z) selected by the user during the data import ([step 2](#step-2-import-data)) from date and time (_Set datetime_). Within the query, this variable must be added where the time instant at which the data will be extracted is indicated.

On the other hand, in order to extract the query data, the name of the column containing the tag identifiers and the related values must be indicated. Each tag can have a single value or a list of them. If it is a list, it can have a defined or undefined number of values. In addition, if the model requires it, the output data can be transposed just before sending it.

- **Query** (required): Query that allows importing the values of the tags used by the model. This must be configured in its corresponding tab.
- **Select date only** (optional): If enabled, the time field will be hidden during data import in Step 2. Only the date will be selectable, and the previously configured time variable will automatically be filled in ISO format without the time component (e.g., 2023-03-01).
- **Tags column** (required): Name of the column containing the tag identifier.
- **Values column** (required): Name of the column containing the values.
- **Returns a list of values** (required): If checked, indicates that the model requires more than one column other than tags. If unchecked, it indicates that only one column is used. If it indicates that only one is required and the query returns more than one column, the first column other than tags will be taken and the rest will be discarded.
- **Transpose values table** (optional): Allows to transpose the data matrix resulting from preprocessing and scaling just before sending it to the model.
<p align="center">
  <img src="https://github.com/ertis-research/whatif-panel-for-Grafana/assets/48439828/5487acdc-ce8c-45b1-b410-674aba0817e2"/>
</p>

- **Fixed number of values** (optional): Indicates the exact number of values that the list of each tag should have.
  - If the field is empty, it means that the value is undefined, so the values of all columns will be extracted and null values will not be treated.
  - If the field is filled with a number, the value lists of each tag will be exactly that length. If the number of columns returned by the query is greater than the given number N, the first N columns will be taken and the others will be discarded. If the number is less, as many null values will be added as necessary. In either case, the null values will be subsequently replaced by the average of the non-null values in the list.

Optionally, we can enable data import using a time range. This does not replace the import from an datetime instant. To configure this, the following fields in the _Range Query_ section must be completed::
- **Query** (required): Query that allows importing the values of the tags used by the model. This must be configured in its corresponding tab. For this case, it is desirable to allow data to be extracted from a range. 
- **Start datetime variable** (required): Table variable to be replaced by the time instant in ISO 8601 UTC (e.g. 2023-03-01T13:46:58Z) selected by the user during the data import ([step 2](#step-2-import-data)) from date and time (_Set datetime_). Within the query, this variable must be added as the start datetime to extract the data. The variable previously configured as _variable time_ should be used as the stop datetime.
- **Select date only** (optional): If enabled, the time field will be hidden during data import in Step 2. Only the date will be selectable, and the previously configured variables (_start datetime_ and _time variable_) will automatically be filled in ISO format without the time component (e.g., 2023-03-01).

With this configuration, the tool will be able to replace the value of the dashboard variables with the appropriate ones and extract the information returned by the data source to be entered as original data in the tag list of the modification section ([step 3](#step-3-modify-data)).

#### Extra information

This functionality allows adding some useful information in the prediction section in order to help the user to understand the reliability of the data displayed or to provide any other type of message that may be relevant.

This information must be contained in a query that can use the variables specified in the [data import](#data-import-queries) (time and tag list) if necessary. This query should return a table relating a text identifier to a value of any type. It should also be noted that the tool will only display the first two rows, while the remaining rows (if any) can be consulted by clicking on the _See more_ button.

> [!NOTE]
> If the value is an instant of time in ISO 8601 UTC the tool will automatically display it in **YYYYY-MM-DD HH:mm** format in local time.

This query must be defined in the corresponding section (_query_) after selecting the appropriate data source. Once configured, it can be assigned to the models that use it within their specific configuration, also indicating the name of the columns containing the information:
- **Extra info** (optional): Query that allows to add extra information to the models. This must be configured in its corresponding tab.
- **Names column** (optional): Name of column containing the text that names and identifies the information.
- **Values column** (optional): Name of the column containing the value of the identified information.
 
With this configuration, the tool will be able to extract the information returned by the data source to introduce it as extra information in a section within the prediction section ([step 4](#step-4-predict-result)).

#### Extra calculation

This feature allows for adding complementary calculations to the models within the tool, providing additional information to facilitate analysis. All calculations will be configured in the designated section (_Extra Calculations_), which is independent of models and formats. You can assign these calculations to any desired models within their configuration. Currently, only the option for recursive calculations has been implemented, though it may be expanded in the future to include other types of calculations.

##### Recursive calculation
This type of calculation enables iterations in which a value, derived from a formula or a static value, is applied to a specific tag. The model runs with updated data in each iteration, applying the value to the tag in a loop that continues until a defined condition is met. Both the value to be applied and the final condition are expressed through formulas that may include variables influencing the calculation, such as the selected date or defined dynamic fields, where the user manually enters values before starting the calculation. For example, it is possible to define a dynamic field to set a limit on the model's result and configure the calculation to add half the value of another tag in each iteration until this limit is reached. Once the calculation is complete, the results can be displayed using the previously configured variables and may include, for instance, the number of iterations performed, the maximum value reached before meeting the condition, the tag’s final value, or a combination of these data. Additionally, a graph is generated that illustrates the model's behavior throughout the iterations, similar to the tool's standard visualization. To optimize calculation efficiency, all model executions are grouped into configurable-sized blocks, so that API requests are processed in batches rather than individually.

> [!IMPORTANT]
> **If the user has manually modified values in the collection, the new dataset will be used to run the calculation. This does not apply to intervals; tags selected for interval analysis will not be taken into account for this function and only their imported values will be considered.**

For creating a new calculation, the form is divided into three sections: basic configuration, dynamic fields and the formulas necessary to perform the calculation and display the results. The basic fields are:
- **ID** (required): Identifier of the calculation. It will be shown in the extra calculation selector in the model configuration.
- **Name** (required): A descriptive name for the calculation in plain language, enabling users to easily identify its purpose.
- **When to apply** (required): Defines when the calculation will be executed. Two options are available:
  - **After preprocessing**: The values will be considered as they are input into the model, meaning after preprocessing and scaling.
  - **Before preprocessing**: The values will be considered as displayed/edited by the user, meaning before preprocessing and scaling.
- **Maximum iterations** (optional): Maximum number of iterations allowed. This limit is implemented to prevent the application from crashing due to infinite queries. Default is 1000.
- **Parallel requests** (optional): Size of the API request blocks that will be made to enhance the efficiency of the calculation. This number will not impact the final result. It is advisable to find a size that balances the speed of computation with the processing capacity of the model's API. Default is 10.

You can add as many dynamic fields as you find necessary. These fields allow users to manually input data required for the calculation, condition or conclusion. They will appear in the tool's interface next to the button for executing the calculation. The process of adding dynamic fields is similar to adding tags; simply click the _Add field_ button to create a new one. You can also delete them using the red button with an "X" on the right side. Each field will have the following parameters:

- **Name** (required): Natural language name of the dynamic field that will be displayed to the user. 
- **Type** (required): Field type. This can be numeric, text, or date. The field displayed in the tool’s interface will correspond to the selected type.

The identifier for each dynamic field is displayed to the left of its name and starts with "dyn" followed by a number (_dyn1_, for example). This identifier should be used to reference the value entered by the user within the formulas. During execution, it will be replaced by the field’s value according to the format corresponding to the selected type (details will be provided below).

> [!CAUTION]
> Deleting dynamic fields is possible; however, keep in mind that if you delete one in the middle, **the identifiers of those following it will shift up**. For example, if you have three dynamic fields and delete dyn2, the third field will become dyn2, and there will no longer be a dyn3.

Next, you need to define the calculation, considering the value to be added, the stopping condition, and the final conclusion. All of this will be determined using _formulas_, which are essentially **JavaScript code that must return a specific data type**. This code will always execute within a sandbox to avoid security issues. In these formulas, variables can be included to use information about the calculation, the collection, or the dynamic fields; these will be replaced by the corresponding values before execution. **You can use all the basic methods and types provided by JavaScript**, but you must do so in a single line. It is not possible to import libraries. This allows you to create more complex formulas.

> [!TIP]
> We recommend using a [JavaScript playground](https://playcode.io/javascript) to test the functionality of the formula. You can replace the variables in the formula with JavaScript variables or static values to test it.

The currently available variables that can be included in the formulas are as follows:

- **$out**: Numeric. It may contain decimals, using a period as the decimal separator. During calculation, it represents the output of the ML model for each iteration. Once completed, it corresponds to the last valid model output before the stopping condition is met. In both cases, the model’s output is used as-is, without rounding.
- **$[X]**: Numeric. It may contain decimals, using a period as the decimal separator. In this case, **_X_ should be replaced by a model tag**. The existence of the tag in the model is not checked, so if it does not exist, it will be undefined. During calculation, this variable will be replaced by the tag value used in the model's input data for each iteration. Once completed, the value will correspond to the tag value for the input data of the last iteration before the stopping condition is met. In both cases, the value will correspond to either the preprocessed or unprocessed data, depending on the setting of the _When to apply_ field configured earlier.
- **$iter**: Numeric. It is an integer. During calculation, it corresponds to the index of each iteration. Once completed, it represents the number of iterations performed before meeting the stopping condition (excluding the iteration that meets it). In both cases, it starts at 0.
- **$date**: String in single quotes indicating a date in the format YYYY-MM-DD. This represents the date selected by the user to import data into the collection. If a time range was used, the stop date of that range will be considered. Time is disregarded, so no timezone is applied, and the date is used exactly as it appears in the user's local timezone.
- **$dynX**: This corresponds to the value of dynamic field X (where X is a number) configured in the previous section. If a dynamic field that does not exist is specified, it will be replaced with _undefined_. Its representation will depend on the type selected for the field:
  - **Number**: Numeric. It may contain decimals, using a period as the decimal separator. No quotes.
  - **Text**: String in single quotes.
  - **Date**: String in single quotes indicating a date in the format YYYY-MM-DD. The time is not specified.

Now you have the ability to write the formulas that will define the calculation. This configuration is divided into two parts: one corresponding to the iterations performed during the calculation’s execution, and the other to the representation of the final result within the tool.

_Iterations_
- **Initial tag**: The name of the tag to which the calculated value will be added recursively until the stopping condition is met. It must correspond to the name of a tag in the associated model. Since this is not verified, if the tag does not exist, its value will be undefined, and the calculation will fail.
- **Calculation**: Defines how the calculated value will be added to the tag's last value. This can be by adding (+), subtracting (-), multiplying (*), or dividing (/).
- **Value to consider**: Formula (JavaScript code) that must return a number. This is the formula used to obtain the calculated value that will be added recursively to the tag's initial value. This formula runs on the initial data (preprocessed or unprocessed, as specified) and retains its value throughout the rest of the execution.
- **Execute until**: Formula (JavaScript code) that must return a boolean. This is the formula used to determine the stopping condition of the calculation. This formula is executed in each iteration after receiving the model's result with the modified data.

_Final result_
- **Value**: Formula (JavaScript code) that must return a string or a number. This is the formula that presents the main conclusion of the calculation. It will depend on the needs of your calculation; for example, it may show the maximum value reached by the model, the number of iterations or perform some calculation to determine a predicted date. This information will be displayed in the tool's interface after the calculation execution is complete.
- **Format**: This field allows for formatting the data resulting from the _Value_ formula. Most formats can be applied directly within the formulas, but if a more complex format is required, this field can easily be expanded to include it (by modifying the [plugin's source code](#build-from-source)). For now, the available options are:
  - **Raw**: Does not apply any format; it leaves the value exactly as it comes from the formula.
  - **Add as days to selected date**: The result of the _Value_ formula must be a number. This format assumes that the number represents the days that must be added to the date selected to import the data (in the case of an range, it refers to the stop date). This number of days is added to that date, and returns the predicted day as a string, where the day and year are numeric, and the month is long.
- **Subtitle**:  Formula (JavaScript code) that must return a string. The result of this formula is added as a subtitle below the final conclusion. You can use it to include relevant static information or other calculation results that may be useful.

The following diagram provides a simplified view of the operation of recursive calculation, emphasizing which field is used for each activity.

![diagrama-recursive-calculation](https://github.com/user-attachments/assets/97a78064-779d-4873-b056-dec081ab8838)

With this, the recursive calculation will be fully configured. Add it to the models in which you want to include it and apply the changes so users can utilize it. If you see that the calculation is not working correctly, **you can use the browser console to check the calculation logs**.

## Build from source

If you'd like to build the plugin yourself, start by cloning the repository using the following command:

```bash
git clone https://github.com/ertis-research/grafana-panel-what-if.git
cd grafana-panel-what-if
```

Also, you will need to satisfy the following requirements:

- [Node.js](https://nodejs.org/es) - version 16 or above (v18.13.0 has been used for development)
- [Yarn](https://yarnpkg.com/) - version 1 (v1.22.11 has been used for development)

#### Development mode

Running the plugin in development mode is the best approach if you want to modify or add functionalities to the tool. To do this, you will need to have an active local installation of Grafana and place the source code you downloaded into the [Grafana plugins folder](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins). In the [Grafana configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/), you will need to add the identifier (`ertis-whatif-panel`) to the list of unsigned plugins ([`allow_loading_unsigned_plugins`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins)). These steps may vary depending on your operating system; refer to the Grafana documentation for more information. Next, in the root folder of the project, execute the following commands:

```bash
yarn install
yarn dev
```

After running these commands, [restart Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/start-restart-grafana/) according to the instructions for your operating system. This way, every time you save a change in the code, it will automatically compile, and upon reloading the page, you will see the changes reflected.

> [!WARNING]
> If the plugin is not available, it is possible that the Grafana instance is not configured correctly for development. This can be verified by checking the *grafana.ini* file and checking that the [*app_mode*](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#app_mode) option is set to *development*.

> [!WARNING]
> If you notice that the changes are not being reflected correctly, it is likely due to the browser cache. Try clearing your browsing data, re-running the commands, and restarting Grafana. If this doesn’t resolve the issue, you can also try deleting the `.cache` folder within `node_modules`, and then repeat the previous steps.

#### Production mode

To allow the plugin to run, it needs to be signed following the [guidelines](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/) provided by Grafana. However, there is also the option to explicitly indicate that the plugin can be executed without signature. To do this, its identifier must be included in the [`allow_loading_unsigned_plugins`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins) option of the *grafana.ini* file.

To build the plugin for a production environment, run the following command to install dependencies and build plugin:

```bash
yarn install
yarn build
```

As output, a folder called *dist* will be generated in the root of the project, which will contain the plugin build. **This folder should be placed inside the [plugins folder](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins) of the production environment and renamed with the plugin identifier (`ertis-whatif-plugin`)**

Once these steps are completed, the plugin will be available for selection when adding a new panel to a dashboard.

