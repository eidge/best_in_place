/*
 * BestInPlace (for jQuery)
 * version: 3.0.0.alpha (2014)
 *
 * By Bernat Farrero based on the work of Jan Varwig.
 * Examples at http://bernatfarrero.com
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @requires jQuery
 *
 * Usage:
 *
 * Attention.
 * The format of the JSON object given to the select inputs is the following:
 * [["key", "value"],["key", "value"]]
 * The format of the JSON object given to the checkbox inputs is the following:
 * ["falseValue", "trueValue"]

 */
//= require jquery.autosize

function BestInPlaceEditor(e) {
    'use strict';
    this.element = e;
    this.initOptions();
    this.bindForm();
    this.initPlaceHolder();
    jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
}

BestInPlaceEditor.prototype = {
    // Public Interface Functions //////////////////////////////////////////////

    activate: function () {
        'use strict';
        var to_display;
        if (this.isPlaceHolder()) {
            to_display = "";
        } else if (this.original_content) {
            to_display = this.original_content;
        } else {
            switch (this.formType) {
                case 'input':
                case 'textarea':
                    if (this.display_raw) {
                        to_display = this.element.html().replace(/&amp;/gi, '&');
                    }
                    else {
                        var value = this.element.data('bipValue');
                        if (typeof value === 'undefined') {
                            to_display = '';
                        } else if (typeof value === 'string') {
                            to_display = this.element.data('bipValue').replace(/&amp;/gi, '&');
                        } else {
                            to_display = this.element.data('bipValue');
                        }
                    }
                    break;
                case 'select':
                    to_display = this.element.html();
                case 'grouped_select':
                    to_display = this.element.html();

            }
        }

        this.oldValue = this.isPlaceHolder() ? "" : this.element.html();
        this.display_value = to_display;
        jQuery(this.activator).unbind("click", this.clickHandler);
        this.activateForm();
        this.element.trigger(jQuery.Event("best_in_place:activate"));
    },

    abort: function () {
        'use strict';
        this.activateText(this.oldValue);
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:abort"));
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));
    },

    abortIfConfirm: function () {
        'use strict';
        if (!this.useConfirm) {
            this.abort();
            return;
        }

        if (confirm(BestInPlaceEditor.defaults.locales[''].confirmMessage)) {
            this.abort();
        }
    },

    update: function () {
        'use strict';
        var editor = this;
        //FIXME: This should be a function, should not be hardcoded here and in
        //create!!!!
        var value = editor.element.attr('data-bip-display-as');
        editor.element.removeAttr('data-bip-display-as'); // Should only be read once!
        value = value || editor.getValue();

        // Avoid request if no change is made
        if (this.formType in {"input": 1, "textarea": 1} && value === this.oldValue) {
            this.abort();
            return true;
        }

        editor.ajax({
            "type": BestInPlaceEditor.defaults.ajaxMethod,
            "dataType": BestInPlaceEditor.defaults.ajaxDataType,
            "data": editor.requestData(),
            "success": function (data) {
                editor.loadSuccessCallback(data);
            },
            "error": function (request, error) {
                editor.loadUpdateErrorCallback(request, error);
            }
        });


        switch (this.formType) {
            case "select":
                this.previousCollectionValue = value;

                // search for the text for the span
                jQuery.each(this.values, function (i, v) {
                        if (String(value) === String(i)) {
                            editor.element.html(v);
                        }
                    }
                );
                break;

            case "grouped_select":
                this.previousCollectionValue = value;

                // search for the text for the span
                jQuery.each(this.values, function (i, group) {
                    var group_name = group[0];
                    var group_values = group[1];
                    jQuery.each(group_values, function (i, v) {
                        if (String(value) === String(v[1])) {
                            editor.element.html(v[0]);
                        }
                    })
                });
                break;

            case "checkbox":
                editor.element.html(this.values[value]);
                break;

            default:
                if (value !== "") {
                    if (this.display_raw) {
                        editor.element.html(value);
                    } else {
                        editor.element.text(value);
                    }
                } else {
                    editor.element.html(this.placeHolder);
                }
        }

        editor.element.data('bipValue', value);
        editor.element.trigger(jQuery.Event("best_in_place:update"));
    },

    create: function(dataFieldsSelector) {
      editor = this;
      data = dataFieldsSelector
               .map(function() {
                 return $(this).data("bestInPlaceEditor").requestData();
               })
               .toArray()
               .join('&');

      editor.ajax({
          "type": 'POST',
          "dataType": BestInPlaceEditor.defaults.ajaxDataType,
          "data": data,
          "success": function (data) {
            dataFieldsSelector.each(function(){
              var editor = $(this).data('bestInPlaceEditor');
              //FIXME: This should be a function, should not be hardcoded here!
              var value = editor.element.attr('data-bip-display-as');
              editor.element.removeAttr('data-bip-display-as'); // Should only be read once!
              value = value || editor.getValue();
              switch (editor.formType) {
                  case "select":
                      editor.previousCollectionValue = value;

                      // search for the text for the span
                      jQuery.each(editor.values, function (i, v) {
                              if (String(value) === String(i)) {
                                  editor.element.html(v);
                              }
                          }
                      );
                      break;

                  case "grouped_select":
                      this.previousCollectionValue = value;

                      // search for the text for the span
                      jQuery.each(editor.values, function (i, group) {
                          var group_name = group[0];
                          var group_values = group[1];
                          jQuery.each(group_values, function (i, v) {
                              if (String(value) === String(v[1])) {
                                  editor.element.html(v[0]);
                              }
                          })
                      });
                      break;

                  case "checkbox":
                      editor.element.html(editor.values[value]);
                      break;

                  default:
                      if (value !== "") {
                          if (editor.display_raw) {
                              editor.element.html(value);
                          } else {
                              editor.element.text(value);
                          }
                      } else {
                          editor.element.html(editor.placeHolder);
                      }
              }
              editor.element.attr('data-original-value', value);
              editor.loadCreateSuccessCallback(data);
              editor.element.html(editor.placeHolder);
            });
            $("#temporary-row").removeAttr('id');
            editor.element.trigger(jQuery.Event("best_in_place:created"));
            editor.element.trigger(jQuery.Event("best_in_place:success"), data);
          },
          "error": function (request, error) {
            editor.loadCreateErrorCallback(dataFieldsSelector, request, error);
          }
      });

      dataFieldsSelector.each(function(){
        var editor = $(this).data('bestInPlaceEditor');
        value = editor.getValue();


        editor.element.data('bipValue', value);
        editor.element.trigger(jQuery.Event("best_in_place:create"));
      });

    },

    activateForm: function () {
        'use strict';
        alert(BestInPlaceEditor.defaults.locales[''].uninitializedForm);
    },

    activateText: function (value) {
        'use strict';
        this.element.html(value);
        if (this.isPlaceHolder()) {
            this.element.html(this.placeHolder);
        }
    },

    // Helper Functions ////////////////////////////////////////////////////////

    initOptions: function () {
        // Try parent supplied info
        'use strict';
        var self = this;
        self.element.parents().each(function () {
            var $parent = jQuery(this);
            self.url = self.url || $parent.data("bipUrl");
            self.activator = self.activator || $parent.data("bipActivator");
            self.okButton = self.okButton || $parent.data("bipOkButton");
            self.okButtonClass = self.okButtonClass || $parent.data("bipOkButtonClass");
            self.manualUpdate = self.manualUpdate || $parent.data("manualUpdate");
            self.newElement = self.newElement || $parent.data("newElement");
            self.cancelButton = self.cancelButton || $parent.data("bipCancelButton");
            self.cancelButtonClass = self.cancelButtonClass || $parent.data("bipCancelButtonClass");
        });

        // Load own attributes (overrides all others)
        self.url = self.element.data("bipUrl") || self.url || document.location.pathname;
        self.collection = self.element.data("bipCollection") || self.collection;
        self.formType = self.element.data("bipType") || "input";
        self.objectName = self.element.data("bipObject") || self.objectName;
        self.attributeName = self.element.data("bipAttribute") || self.attributeName;
        self.activator = self.element.data("bipActivator") || self.element;
        self.okButton = self.element.data("bipOkButton") || self.okButton;
        self.okButtonClass = self.element.data("bipOkButtonClass") || self.okButtonClass || BestInPlaceEditor.defaults.okButtonClass;
        self.manualUpdate = self.element.data("bipManualUpdate") || self.manualUpdate || BestInPlaceEditor.defaults.manualUpdate;
        self.newElement = self.element.data("bipNewElement") || self.newElement || BestInPlaceEditor.defaults.newElement;
        self.cancelButton = self.element.data("bipCancelButton") || self.cancelButton;
        self.cancelButtonClass = self.element.data("bipCancelButtonClass") || self.cancelButtonClass || BestInPlaceEditor.defaults.cancelButtonClass;
        self.placeHolder = self.element.data("bipPlaceholder") || BestInPlaceEditor.defaults.locales[''].placeHolder;
        self.inner_class = self.element.data("bipInnerClass");
        self.html_attrs = self.element.data("bipHtmlAttrs");
        self.original_content = self.element.data("bipOriginalContent") || self.original_content;

        // if set the input won't be satinized
        self.display_raw = self.element.data("bip-raw");

        self.useConfirm = self.element.data("bip-confirm");


        if (self.formType === "select" || self.formType === "grouped_select" || self.formType === "checkbox") {
            self.values = self.collection;
            self.collectionValue = self.element.data("bipValue") || self.collectionValue;
        }
    },

    bindForm: function () {
        'use strict';
        this.activateForm = BestInPlaceEditor.forms[this.formType].activateForm;
        this.getValue = BestInPlaceEditor.forms[this.formType].getValue;
    },


    initPlaceHolder: function () {
        'use strict';
        // TODO add placeholder for select and checkbox
        if (this.element.html() === "") {
            this.element.html(this.placeHolder);
        }
    },

    isPlaceHolder: function () {
        'use strict';
        // TODO: It only work when form is deactivated.
        // Condition will fail when form is activated
        return this.element.html() === "" || this.element.html() === this.placeHolder;
    },

    getValue: function () {
        'use strict';
        alert(BestInPlaceEditor.defaults.locales[''].uninitializedForm);
    },

    // Trim and Strips HTML from text
    sanitizeValue: function (s) {
        'use strict';
        return jQuery.trim(s);
    },

    /* Generate the data sent in the POST request */
    requestData: function () {
        'use strict';
        // To prevent xss attacks, a csrf token must be defined as a meta attribute
        var csrf_token = jQuery('meta[name=csrf-token]').attr('content'),
            csrf_param = jQuery('meta[name=csrf-param]').attr('content');

        //var data = "_method=" + BestInPlaceEditor.defaults.ajaxMethod;
        var data = this.objectName + '[' + this.attributeName + ']=' + encodeURIComponent(this.getValue());

        if (csrf_param !== undefined && csrf_token !== undefined) {
            data += "&" + csrf_param + "=" + encodeURIComponent(csrf_token);
        }
        return data;
    },

    ajax: function (options) {
        'use strict';
        options.url = this.url;
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader("Accept", "application/json");
        };
        return jQuery.ajax(options);
    },

    // Handlers ////////////////////////////////////////////////////////////////

    loadSuccessCallback: function (data) {
        'use strict';

        data = jQuery.trim(data);

        this.element.parent().switchClass('bip-error', '');
        //Update original content with current text.
        if (this.display_raw) {
          this.original_content = this.element.html();
        } else {
          this.original_content = this.element.text();
        }

        if (data && data !== "") {
            var response = jQuery.parseJSON(data);
            if (response !== null && response.hasOwnProperty("display_as")) {
                this.element.data('bip-original-content', this.element.text());
                this.element.html(response.display_as);
            }
            //Refactor to use ifNew
            if(response !== null && response.hasOwnProperty("id")) {
              var id = this.element.data('bip-object') + '_' + response.id;
              if(!$('#' + id).length)
                this.element.parent().parent().before('<tr id="' + id + '">');

              var url = this.element.data('bip-url') + '/' + response.id;
              var new_element = this.element.clone();

              new_element.attr('data-bip-url', url);
              new_element.removeAttr('data-bip-manual-update');
              new_element.removeAttr('data-bip-new-element');
              new_element.attr('data-bip-value', this.original_content);
              new_element.best_in_place(true);
              $("#" + id).append($('<td>').html(new_element));

              //reset field state
              this.element.attr('data-bip-value', '');
              this.element.attr('data-bip-original-content', '');
            }

            this.element.trigger(jQuery.Event("best_in_place:success"), data);
            this.element.trigger(jQuery.Event("ajax:success"), data);
        } else {
            this.element.trigger(jQuery.Event("best_in_place:success"));
            this.element.trigger(jQuery.Event("ajax:success"));
        }
        // Binding back after being clicked
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));

        if (this.collectionValue !== null && (this.formType === "select" || this.formType === "grouped_select")) {
            this.collectionValue = this.previousCollectionValue;
            this.previousCollectionValue = null;
        }
    },

    loadCreateSuccessCallback: function (data) {
        'use strict';

        data = jQuery.trim(data);

        this.element.parent().switchClass('bip-error', '');
        //Update original content with current text.
        if (this.display_raw) {
          this.original_content = this.element.html();
        } else {
          this.original_content = this.element.text();
        }

        if (data && data !== "") {
            var response = jQuery.parseJSON(data);
            if (response !== null && response.hasOwnProperty("display_as")) {
                this.element.data('bip-original-content', this.element.text());
                this.element.html(response.display_as);
            }
            //Refactor to use ifNew
            if(response !== null && response.hasOwnProperty("id")) {
              var id = this.element.data('bip-object') + '_' + response.id;
              if(!$('#' + id).length)
                this.element.parent().parent().before('<tr id="' + id + '">');

              var url = this.element.data('bip-url') + '/' + response.id;
              var new_element = this.element.clone();

              new_element.attr('data-bip-url', url);
              new_element.removeAttr('data-bip-manual-update');
              new_element.removeAttr('data-bip-new-element');
              new_element.attr('data-bip-value', this.original_content);
              new_element.best_in_place(true);
              $("#" + id).append($('<td>').html(new_element));

              //reset field state
              this.element.attr('data-bip-value', '');
              this.element.attr('data-bip-original-content', '');
            }

        } else {
        }
        // Binding back after being clicked
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));

        if (this.collectionValue !== null && (this.formType === "select" || this.formType === "grouped_select")) {
            this.collectionValue = this.previousCollectionValue;
            this.previousCollectionValue = null;
        }
    },


    loadUpdateErrorCallback: function (request, error) {
        'use strict';
        // FIXME: Let's use an option for this! revertValueOnError: true/false
        //if(!this.element.data('bip-revert-on-error'))
        //  this.activateText(this.oldValue);

        this.element.parent().switchClass('', 'bip-error');

        this.element.trigger(jQuery.Event("best_in_place:error"), [request, error]);
        this.element.trigger(jQuery.Event("ajax:error"), request, error);

        // Binding back after being clicked
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));
        this.element.focus();
    },

    loadCreateErrorCallback: function (fields, request, error) {
        'use strict';
        // FIXME: Let's use an option for this! revertValueOnError: true/false
        //if(!this.element.data('bip-revert-on-error'))
        //  this.activateText(this.oldValue);

        fields.each(function(){
          var editor = $(this).data('bestInPlaceEditor');
          editor.element.parent().switchClass('', 'bip-error');

          // Binding back after being clicked
          jQuery(editor.activator).bind('click', {editor: editor}, editor.clickHandler);
          editor.element.trigger(jQuery.Event("best_in_place:deactivate"));
          editor.element.focus();
        });

        this.element.trigger(jQuery.Event("ajax:error"), request, error);
        fields.first().trigger(jQuery.Event("best_in_place:not_created"), [request, error]);
    },

    clickHandler: function (event) {
        'use strict';
        event.preventDefault();
        event.data.editor.activate();
    },

    setHtmlAttributes: function () {
        'use strict';
        var formField = this.element.find(this.formType);

        if (this.html_attrs) {
            var attrs = this.html_attrs;
            $.each(attrs, function (key, val) {
                formField.attr(key, val);
            });
        }
    },

    placeButtons: function (output, field) {
        'use strict';
        if (field.okButton) {
            output.append(
                jQuery(document.createElement('input'))
                    .attr('type', 'submit')
                    .attr('class', field.okButtonClass)
                    .attr('value', field.okButton)
            );
        }
        if (field.cancelButton) {
            output.append(
                jQuery(document.createElement('input'))
                    .attr('type', 'button')
                    .attr('class', field.cancelButtonClass)
                    .attr('value', field.cancelButton)
            );
        }
    }
};


// Button cases:
// If no buttons, then blur saves, ESC cancels
// If just Cancel button, then blur saves, ESC or clicking Cancel cancels (careful of blur event!)
// If just OK button, then clicking OK saves (careful of blur event!), ESC or blur cancels
// If both buttons, then clicking OK saves, ESC or clicking Cancel or blur cancels
BestInPlaceEditor.forms = {
    "input": {
        activateForm: function () {
            'use strict';
            var output = jQuery(document.createElement('form'))
                .addClass('form_in_place')
                .attr('action', 'javascript:void(0);')
                .attr('style', 'display:inline');
            var input_elt = jQuery(document.createElement('input'))
                .attr('type', 'text')
                .attr('name', this.attributeName)
                .attr('class', 'best-in-place-input')
                .val(this.display_value);

            // Add class to form input
            if (this.inner_class) {
                input_elt.addClass(this.inner_class);
            }

            output.append(input_elt);
            this.placeButtons(output, this);

            this.element.html(output);
            this.setHtmlAttributes();

            if (!this.manualUpdate) {
              this.element.find("input[type='text']")[0].focus();
              this.element.find("form").bind('submit', {editor: this}, BestInPlaceEditor.forms.input.submitHandler);
              if (this.cancelButton) {
                  this.element.find("input[type='button']").bind('click', {editor: this}, BestInPlaceEditor.forms.input.cancelButtonHandler);
              }
              this.element.find("input[type='text']").bind('blur', {editor: this}, BestInPlaceEditor.forms.input.inputBlurHandler);
              this.element.find("input[type='text']").bind('keyup', {editor: this}, BestInPlaceEditor.forms.input.keyupHandler);
            }
            this.blurTimer = null;
            this.userClicked = false;
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("input.best-in-place-input").val());
        },

        // When buttons are present, use a timer on the blur event to give precedence to clicks
        inputBlurHandler: function (event) {
            'use strict';
            if (event.data.editor.okButton) {
                event.data.editor.blurTimer = setTimeout(function () {
                    if (!event.data.editor.userClicked) {
                        event.data.editor.abort();
                    }
                }, 500);
            } else {
                if (event.data.editor.cancelButton) {
                    event.data.editor.blurTimer = setTimeout(function () {
                        if (!event.data.editor.userClicked) {
                            event.data.editor.update();
                        }
                    }, 500);
                } else {
                    event.data.editor.update();
                }
            }
        },

        submitHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.update();
        },

        cancelButtonHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.abort();
            event.stopPropagation(); // Without this, click isn't handled
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abort();
            }
        }
    },

    "select": {
        activateForm: function () {
            'use strict';
            var output = jQuery(document.createElement('form'))
                    .attr('action', 'javascript:void(0)')
                    .attr('style', 'display:inline'),
                selected = '',
                select_elt = jQuery(document.createElement('select'))
                    .attr('class', this.inner_class !== null ? this.inner_class : '')
                    .addClass('best-in-place-input'),
                currentCollectionValue = this.collectionValue;

            jQuery.each(this.values, function (key, value) {
                var option_elt = jQuery(document.createElement('option'))
                    .val(key)
                    .html(value);
                if (key === String(currentCollectionValue)) {
                    option_elt.attr('selected', 'selected');
                }
                select_elt.append(option_elt);
            });
            output.append(select_elt);

            this.element.html(output);
            this.setHtmlAttributes();
            if (!this.manualUpdate) {
              this.element.find("select").bind('change', {editor: this}, BestInPlaceEditor.forms.select.blurHandler);
              this.element.find("select").bind('blur', {editor: this}, BestInPlaceEditor.forms.select.blurHandler);
              this.element.find("select").bind('keyup', {editor: this}, BestInPlaceEditor.forms.select.keyupHandler);
              this.element.find("select")[0].focus();
            }
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("select").val());
        },

        blurHandler: function (event) {
            'use strict';
            event.data.editor.update();
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abort();
            }
        }
    },

    "grouped_select": {
        activateForm: function () {
            'use strict';
            var output = jQuery(document.createElement('form'))
                    .attr('action', 'javascript:void(0)')
                    .attr('style', 'display:inline'),
                selected = '',
                select_elt = jQuery(document.createElement('select'))
                    .attr('class', this.inner_class !== null ? this.inner_class : '')
                    .addClass('best-in-place-input'),
                currentCollectionValue = this.collectionValue;

            jQuery.each(this.values, function (i, group) {
              var group_name = group[0];
              var group_values = group[1];
              var optgroup_elt = jQuery(document.createElement('optgroup'))
                  .attr('label', group_name);

              jQuery.each(group_values, function (i, value) {
                  var option_elt = jQuery(document.createElement('option'))
                      .val(value[1])
                      .html(value[0]);
                  if (value[1] === String(currentCollectionValue)) {
                      option_elt.attr('selected', 'selected');
                  }
                  optgroup_elt.append(option_elt);
              });

              select_elt.append(optgroup_elt);
            });
            output.append(select_elt);

            this.element.html(output);
            this.setHtmlAttributes();
            if (!this.manualUpdate) {
              this.element.find("select").bind('change', {editor: this}, BestInPlaceEditor.forms.select.blurHandler);
              this.element.find("select").bind('blur', {editor: this}, BestInPlaceEditor.forms.select.blurHandler);
              this.element.find("select").bind('keyup', {editor: this}, BestInPlaceEditor.forms.select.keyupHandler);
              this.element.find("select")[0].focus();
            }
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("select").val());
        },

        blurHandler: function (event) {
            'use strict';
            event.data.editor.update();
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abort();
            }
        }
    },

    "checkbox": {
        activateForm: function () {
            'use strict';
            this.collectionValue = !this.getValue();
            this.setHtmlAttributes();
            this.update();
        },

        getValue: function () {
            'use strict';
            return this.collectionValue;
        }
    },

    "textarea": {
        activateForm: function () {
            'use strict';
            // grab width and height of text
            var width = this.element.css('width');
            var height = this.element.css('height');

            // construct form
            var output = jQuery(document.createElement('form'))
                .addClass('form_in_place')
                .attr('action', 'javascript:void(0);')
                .attr('style', 'display:inline');
            var textarea_elt = jQuery(document.createElement('textarea'))
                .attr('name', this.attributeName)
                .val(this.sanitizeValue(this.display_value));

            if (this.inner_class !== null) {
                textarea_elt.addClass(this.inner_class);
            }

            output.append(textarea_elt);

            this.placeButtons(output, this);

            this.element.html(output);
            this.setHtmlAttributes();

            // set width and height of textarea
            jQuery(this.element.find("textarea")[0]).css({'min-width': width, 'min-height': height});
            jQuery(this.element.find("textarea")[0]).autosize();

            this.element.find("textarea")[0].focus();
            this.element.find("form").bind('submit', {editor: this}, BestInPlaceEditor.forms.textarea.submitHandler);

            if (this.cancelButton) {
                this.element.find("input[type='button']").bind('click', {editor: this}, BestInPlaceEditor.forms.textarea.cancelButtonHandler);
            }

            this.element.find("textarea").bind('blur', {editor: this}, BestInPlaceEditor.forms.textarea.blurHandler);
            this.element.find("textarea").bind('keyup', {editor: this}, BestInPlaceEditor.forms.textarea.keyupHandler);
            this.blurTimer = null;
            this.userClicked = false;
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("textarea").val());
        },

        // When buttons are present, use a timer on the blur event to give precedence to clicks
        blurHandler: function (event) {
            'use strict';
            if (event.data.editor.okButton) {
                event.data.editor.blurTimer = setTimeout(function () {
                    if (!event.data.editor.userClicked) {
                        event.data.editor.abortIfConfirm();
                    }
                }, 500);
            } else {
                if (event.data.editor.cancelButton) {
                    event.data.editor.blurTimer = setTimeout(function () {
                        if (!event.data.editor.userClicked) {
                            event.data.editor.update();
                        }
                    }, 500);
                } else {
                    event.data.editor.update();
                }
            }
        },

        submitHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.update();
        },

        cancelButtonHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.abortIfConfirm();
            event.stopPropagation(); // Without this, click isn't handled
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abortIfConfirm();
            }
        }
    }
};

BestInPlaceEditor.defaults = {
    locales: {},
    ajaxMethod: "put",  //TODO Change to patch when support to 3.2 is dropped
    ajaxDataType: 'text',
    okButtonClass: '',
    cancelButtonClass: ''
};

// Default locale
BestInPlaceEditor.defaults.locales[''] = {
    confirmMessage: "Are you sure you want to discard your changes?",
    uninitializedForm: "The form was not properly initialized. getValue is unbound",
    placeHolder: '-'
};

jQuery.fn.best_in_place = function () {
    'use strict';
    function setBestInPlace(element) {
      if (!element.data('bestInPlaceEditor')) {
        element.data('bestInPlaceEditor', new BestInPlaceEditor(element));
        return true;
      }
    }

    jQuery(this.context).delegate(this.selector, 'click', function () {
      var el = jQuery(this);
      if (setBestInPlace(el)) {
        el.click();
        el.trigger(jQuery.Event("best_in_place:ready"));
      }
    });

    this.each(function () {
      setBestInPlace(jQuery(this));
    });


    return this;
};



