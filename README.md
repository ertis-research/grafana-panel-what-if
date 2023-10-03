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

## :sparkles: Table of Contents

- [Installation](#wrench-installation)
  - [Requirements](#requirements)
  - [Development mode](#development-mode)
  - [Production mode](#production-mode)
- [Getting started](#rocket-getting-started)
- [Documentation](#page_facing_up-documentation)
   - [Panel usage](#panel-usage)
      - [Data collections](#data-collections)
      - [Tag filtering and sorting](#tag-filtering-and-sorting)
      - [Interval behaviour](#interval-behaviour)
      - [Understanding the comparative graph](#understanding-the-comparative-graph)
      - [Extra information about models](#extra-information-about-models)
      - [CSV import/export](#csv-importexport)
      - [Lack of data](#lack-of-data)
   - [Configuration](#configuration)
      - [Basic options](#basic-options)
      - [Models](#models)
      - [Formats](#formats)
      - [Data import queries](#data-import-queries)
      - [Extra information](#extra-information)

## :wrench: Installation

### Requirements

- [Node.js](https://nodejs.org/es) - version 16 or above (v18.13.0 has been used for development)
- [Yarn](https://yarnpkg.com/) - version 1 (v1.22.11 has been used for development)
- [Grafana](https://grafana.com/) - version 8 (v8.5.3 has been used for development, but higher versions will be tested soon)

To compile and install the plugin, it is necessary to download the code from this repository. This can be achieved by cloning it using the following command:

```bash
git clone https://github.com/ertis-research/whatif-panel-for-Grafana.git
cd whatif-panel-for-Grafana
```
### Development mode

To add the plugin in a development environment, you need to include the folder containing the complete code inside the [Grafana designated folder for plugins](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins). Then, the following commands must be executed to install dependencies and build plugin:

```bash
yarn install
yarn dev
```

This will enable the plugin in the instance of Grafana where it has been placed, remaining in watch mode waiting for changes to be saved.

> **Warning**
> If the plugin is not available, it is possible that the Grafana instance is not configured correctly for development. This can be verified by checking the *grafana.ini* file and checking that the [*app_mode*](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#app_mode) option is set to *development*.

### Production mode

To allow the plugin to run, it needs to be signed following the [guidelines](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/) provided by Grafana. However, there is also the option to explicitly indicate that the plugin can be executed without signature. To do this, its identifier must be included in the [*allow_loading_unsigned_plugins*](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins) option of the *grafana.ini* file.

To build the plugin for a production environment, run the following command to install dependencies and build plugin:

```bash
yarn install
yarn build
```

As output, a folder called *dist* will be generated in the root of the project, which will contain the plugin build. **This folder should be placed inside the [plugins folder](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins) of the production environment** (it is recommended to rename it to the plugin identifier). 

Once these steps are completed, the plugin will be available for selection when adding a new panel to a dashboard.


## :rocket: Getting started

> **Note**
> This explanation is simplified for common users and assumes that the plugin has already been added and correctly [configured](#configuration) with the necessary AI/ML models. For more detailed information, it is recommended to consult the rest of the [documentation](#page_facing_up-documentation) provided.

The functionality of the plugin is divided into 5 steps:

#### Step 1: Select model

To begin, the AI/ML model to be used to perform the analysis must be selected. Once chosen, the tags associated with that model will be displayed in step 3. **Although the tool can apply multiple data collections, all of them will use the same model to make predictions**.

#### Step 2: Import data

Several options are provided for entering model tag data. You can select a **specific date and time**, **upload a CSV file**, or **use a variable from the Grafana dashboard** (in particular, [*from* and *to*](https://grafana.com/docs/grafana/latest/dashboards/variables/add-template-variables/#__from-and-__to)). Adding data in any of these ways will create a new collection in the drop-down menu and display the imported values in their respective tags. It is possible to add multiple collections of data (no limit set), even if they correspond to the same datetime.

#### Step 3: Modify data

At this point, it is possible to modify the values of the tags whose variation is to be analysed. To accomplish this, there are 3 options available:

- **Modify values directly:** Each tag consists of two fields: the left one shows the value obtained when importing the data, while the right one is initially empty. If the right field is filled in, the prediction will consider this as the new value of the tag. We can modify as many tags as we want in this way and **the prediction will be done jointly**, i.e. assuming the change of all of them at the same time in the same prediction.

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

## :page_facing_up: Documentation

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

The values of the interval will be applied to the original value by subtracting or adding as absolute values or percentages of it, as defined with the *Type* switch (blue indicates the selected option). In particular:

- If the **percentages** (*%*) option is selected, the values shall be considered as percentages of the original value. If the percentage is negative it will be subtracted from the original value, while if it is positive it will be added.

  For example, if the interval gives -2, -1, 0, 1 and 2 and the original value of the selected tag is 10, the values 9.8, 9.9, 10, 10.1 and 10.2 will be considered. 
- If the **absolute values** option (*Abs.*) is selected, the values will be considered without taking into account the original value, subtracting if it is negative and adding if it is positive.

  For example, if the interval gives -2, -1, 0, 1 and 2 and the original value of the selected tag is 10, the values 8, 9, 10, 11 and 12 will be considered.

When the interval is well defined, **its indicator will turn from red to green** and the boxes next to the values of each tag will be enabled. At this point, **one or more tags can be selected for analysis** with respect to the interval. If after the selection of tags the interval is deconfigured, the boxes will not be disabled and those selected will not be taken into account.

#### Understanding the comparative graph

The graph appears when predicting the results ([step 4](#step-4-predict-result)) when an interval (min ≥ max) is correctly defined and at least one tag is selected for analysis. 

The X axis of the graph indicates the value subtracted or added to the original value of the tag, while the Y axis corresponds to the value returned by the prediction. The points that make up the lines are the predictions that have been made with the different values of the tag. In addition, each point not only indicates the pair (X, Y) to which it belongs but also the **specific value applied to that tag during the prediction**.

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

Some model information can be added in the tool to support the understanding of the prediction results. If configured, this data will be displayed under the predict button in [step 4](#step-4-predict-result) and will appear from the data import onwards (it can be consulted while modifying the tag values). This section can be minimised at any time with the arrow to the left of the title.

The information displayed will depend on the amount of information received by the query:
- If the query **does not return any data** or the extra information has not been configured correctly, the extra information section will not appear.
- If the query **returns one or two pieces of information**, these will be displayed in the section itself.
- If the query **returns more than two pieces of information**, the first two will be displayed in the section itself, while you will have to click on the *See more* button to see the rest. This will display a dialogue window with all available information. To close it you can use the *X* in the top right corner or click anywhere on the page outside the dialogue window.

#### CSV import/export

The data entered in the application and the results obtained can be exported in CSV format for further analysis with other tools or for importing into the application. This import can be useful if you want to continue an ongoing analysis or modify a previous study.

##### CSV file schema

The CSV file may start with two optional comments (preceded by #) which could be in any order. These are:
- The comment starting with **DateTime** indicates the time instant for which this data has been obtained.
- The comment starting with **Interval** indicates the interval that has been defined in the tool. It will only appear if the interval is completely set (its indicator is green).
 
After the comments, the first row marks the name of the CSV columns. The first column is ID, whose values will be used as row identifiers. Except for this and the *_RESULT* column, the rest will correspond to all the tags that enter the model, ordered in such a way that first those that have been modified with a fixed value are shown, then those that have been selected for analysis with interval, and then the rest of the tags.

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
- **Decimals:** Defines the number of decimals to which the prediction results will be rounded. This rounding will not be applied for the prediction or export, but will only be visual when displaying the results both individually and in the graph.

#### Models

**At least one AI/ML model must be configured in order to use the panel.** 

In the Models tab, the list of models already configured (if any) and a section with the blue text to add a new one (_Add new model_) are displayed. This will always appear last in the list, after all the configured models. Clicking on any of these elements will display a form whose content will vary depending on whether it is a configured model or the section for adding a new model.

##### Adding a new model
Clicking on the _Add new model_ section will display a blank form that allows you to define a new model. 

The basic configuration of the model has the following fields:
- **ID** (required): Identifier of the model (it will be shown as main text in the selector of [step 1](#step-1-select-model)).
- **Description** (optional): Description of the model to facilitate its identification by the users (it will be shown under the identifier in the selector of [step 1](#step-1-select-model)).
- **Query** (required): Query that allows importing the values of the tags used by the model. This must be configured in its corresponding tab.
- **Extra info** (optional): Query that allows to add extra information to the models. This must be configured in its corresponding tab.
- **Format** (required): Formats used by the model to process its input and output data. The available options will be those configured in the corresponding section.

Regarding the connection to the model, this shall be done through HTTP and it shall be possible to add basic authentication. The fields to be filled in are the following:
- **Method** (required): Method to be used for the HTTP request. The available values are POST, GET, PUT and PATCH.
- **URL** (required): URL address where the model expects to receive the input data.
- **Username** (optional): Username for basic authentication.
- **Password** (optional): Password for basic authentication.

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
This block will be executed in an sandbox and will receive as input a JSON object called _data_ whose key-value pairs will correspond to the identifier of each tag and its value to send to the model respectively. The output of the code should also be a _data_ object following the same scheme. For example, if the model had 3 tags the _data_ object both as input and output could correspond to:

```json
{
  "01PHD.LMNN4001.PV": 0.43,
  "01PHD.LMLC4028.PV": 0.23,
  "01PHD.LMLC4401.PV": 0.10
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

The values of the tags of the model can be imported directly from one of the data sources configured in Grafana. To do this, a query must be constructed which, taking into account the list of tags in the model, performs the necessary calculations to obtain the input values at a specific time instant. This must return a table that relates each tag with its value. For example, a possible result would be:

This query must be defined within the corresponding section (_query_) after selecting the appropriate data source. Once configured, it can be assigned to the models that use it within their specific configuration.

In order to use the configured tag list and consider the time instant given by the user in the _Set datetime_ section, the query must include [dashboard variables](https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/). These variables must be created in the dashboard configuration (not the panel configuration) and assigned in the corresponding fields in the _Queries_ section of the panel configuration:
- **Variable tags** (required): Dashboard variable to be replaced by the list of tags of the model. Within the query, this variable must be added where the list of identifiers from which information will be extracted is indicated.
- **Format for list of tags** (required): Format to be used for the list of tags of the model when it is replaced in the query. This will correspond to the identifiers of the list separated by commas, being able to choose that each one is contained between double, single or no inverted commas.
- **Variable time** (required): Table variable to be replaced by the time instant in ISO 8601 UTC (e.g. 2023-03-01T13:46:58Z) selected by the user during the data import ([step 2](#step-2-import-data)) from date and time (_Set datetime_). Within the query, this variable must be added where the time instant at which the data will be extracted is indicated.

On the other hand, in order to extract the data from the table, the name of the columns containing the information must be indicated:
- **Name of column containing tags** (required): Name of the column containing the tag identifier.
- **Name of column containing values** (required): Name of the column containing the tag value.

With this configuration, the tool will be able to replace the value of the dashboard variables with the appropriate ones and extract the information returned by the data source to be entered as original data in the tag list of the modification section ([step 3](#step-3-modify-data)).

#### Extra information

This functionality allows adding some useful information in the prediction section in order to help the user to understand the reliability of the data displayed or to provide any other type of message that may be relevant.

This information must be contained in a query that can use the variables specified in the [data import](#data-import-queries) (time and tag list) if necessary. This query should return a table relating a text identifier to a value of any type. It should also be noted that the tool will only display the first two rows, while the remaining rows (if any) can be consulted by clicking on the _See more_ button.

> **Note**
> If the value is an instant of time in ISO 8601 UTC the tool will automatically display it in **YYYYY-MM-DD HH:mm** format in local time.

This query must be defined in the corresponding section (_query_) after selecting the appropriate data source. Once configured, it can be assigned to the models that use it within their specific configuration. On the other hand, in order to be able to extract the data from the table, the name of the columns containing the information must be indicated:
- **ExtraInfo - Name of column containing names** (optional): Name of column containing the text that names and identifies the information.
- **ExtraInfo - Name of column containing values** (optional): Name of the column containing the value of the identified information.
 
With this configuration, the tool will be able to extract the information returned by the data source to introduce it as extra information in a section within the prediction section ([step 4](#step-4-predict-result)).
