
/*
 * Copyright 2018 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env jquery */
/* eslint-env browser */

'use strict';

// canvas colors
const COLOR_NORMAL = '#45f9ff'; //'#00FF00'; // Lime
const COLOR_HIGHLIGHT = '#2a8af7' //'#FFFFFF'; // White
const COLOR_TEXT = '#000000'; // Black

// global vars
var bbox_id_2_name = ['left', 'top', 'right', 'bottom'];

var threshold = 0.5;
var highlight = '';
var filter_list = [];
var predictions = [];

var labels_response = {
  count: 56,
  labels: [
    {
      id: '1',
      name: 'dropdownlist-all'},
    {
      id: '2',
      name: 'dropdownlist-title'},
    {
      id: '3',
      name: 'dropdownlist-dropdownlist'},
    {
      id: '4',
      name: 'dropdownlist-itemlist'},
    {
      id: '5',
      name: 'dropdownlist-item'},
    {
      id: '6',
      name: 'dropdownlist-item_title'},
    {
      id: '7',
      name: 'textbox-all'},
    {
      id: '8',
      name: 'textbox-textbox'},
    {
      id: '9',
      name: 'textbox-title'},
    {
      id: '10',
      name: 'textbox-textbox_value'},
    {
      id: '11',
      name: 'calendar-all'},
    {
      id: '12',
      name: 'calendar-grid'},
    {
      id: '13',
      name: 'calendar-month'},
    {
      id: '14',
      name: 'calendar-year'},
    {
      id: '15',
      name: 'calendar-weekdays'},
    {
      id: '16',
      name: 'calendar-active_day'},
    {
      id: '17',
      name: 'calendar-month_next'},
    {
      id: '18',
      name: 'calendar-month_prev'},
    {
      id: '19',
      name: 'button-all'},
    {
      id: '20',
      name: 'button-title'},
    {
      id: '21',
      name: 'button-button'},
    {
      id: '22',
      name: 'datepicker-all'},
    {
      id: '23',
      name: 'datepicker-datebox'},
    {
      id: '24',
      name: 'datepicker-title'},
    {
      id: '25',
      name: 'datepicker-calendar_button'},
    {
      id: '26',
      name: 'table-all'},
    {
      id: '27',
      name: 'table-title'},
    {
      id: '28',
      name: 'table-table'},
    {
      id: '29',
      name: 'table-body'},
    {
      id: '30',
      name: 'table-columns'},
    {
      id: '31',
      name: 'table-rows'},
    {
      id: '32',
      name: 'table-column_item_title'},
    {
      id: '33',
      name: 'table-row_item_title'},
    {
      id: '34',
      name: 'section-all'},
    {
      id: '35',
      name: 'section-title'},
    {
      id: '36',
      name: 'checkbox-all'},
    {
      id: '37',
      name: 'checkbox-itemlist'},
    {
      id: '38',
      name: 'checkbox-title'},
    {
      id: '39',
      name: 'checkbox-item'},
    {
      id: '40',
      name: 'checkbox-item_selected'},
    {
      id: '41',
      name: 'checkbox-item_unselected'},
    {
      id: '42',
      name: 'checkbox-item_title'},
    {
      id: '43',
      name: 'radiobutton-all'},
    {
      id: '44',
      name: 'radiobutton-itemlist'},
    {
      id: '45',
      name: 'radiobutton-title'},
    {
      id: '46',
      name: 'radiobutton-item'},
    {
      id: '47',
      name: 'radiobutton-item_selected'},
    {
      id: '48',
      name: 'radiobutton-item_unselected'},
    {
      id: '49',
      name: 'radiobutton-item_title'},
    {
      id: '50',
      name: 'listbox-all'},
    {
      id: '51',
      name: 'listbox-itemlist'},
    {
      id: '52',
      name: 'listbox-title'},
    {
      id: '53',
      name: 'listbox-item_selected'},
    {
      id: '54',
      name: 'listbox-item_unselected'},
    {
      id: '55',
      name: 'listbox-item_title'},
    {
      id: '56',
      name: 'screen-screen'}]};

var label_to_id = [];


// Refreshes the label icons visibility
function updateLabelIcons() {
  $('.label-icon').hide();
  for (var i = 0; i < predictions.length; i++) {
    var label_name = predictions[i]['classes'][0]['category_name'];
    var label_type = predictions[i]['classes'][0]['attributes']['type'];
    var label_id = label_to_id[label_name + '-' + label_type];
    var icon_id = '#label-icon-' + label_id;
    if (predictions[i]['classes'][0]['confidence'] > threshold) {
      $(icon_id).show();
    }
  }
}

// a visibility filter for threshold and and label blacklist
function displayBox(i) {
  return predictions[i]['classes'][0]['confidence'] > threshold
    && !filter_list.includes(
      label_to_id[predictions[i]['classes'][0]['category_name'] +
      '-' + predictions[i]['classes'][0]['attributes']['type']]);
}

function clearCanvas() {
  $('#image-display').empty(); // removes previous img and canvas
  predictions = []; // remove any previous metadata
  updateLabelIcons(); // reset label icons
}

// (re)paints canvas (if canvas exists) and triggers label visibility refresh
function paintCanvas() {
  updateLabelIcons();

  if ($('#image-canvas').length) {

    var ctx = $('#image-canvas')[0].getContext('2d');
    var can = ctx.canvas;

    var img = $('#user-image');
    can.width = img.width();
    can.height = img.height();

    ctx.clearRect(0, 0, can.width, can.height);

    ctx.font = '16px "IBM Plex Sans"';
    ctx.textBaseline = 'top';
    ctx.lineWidth = '3';

    for (var i = 0; i < predictions.length; i++) {
      if (displayBox(i)) {
        var label_name = predictions[i]['classes'][0]['category_name'];
        var label_type = predictions[i]['classes'][0]['attributes']['type'];
        if (label_to_id[label_name + '-' + label_type] === highlight) {
          ctx.strokeStyle = COLOR_HIGHLIGHT;
        } else {
          ctx.strokeStyle = COLOR_NORMAL;
        }
        paintBox(i, ctx, can);
      }
    }

    for (i = 0; i < predictions.length; i++) {
      if (displayBox(i)) {
        paintLabelText(i, ctx, can);
      }
    }
  }
}

// module function for painting bounding box on canvas
function paintBox(i, ctx, can) {
  ctx.beginPath();
  var corners = predictions[i]['bbox'];
  var ymin = corners[bbox_id_2_name[1]] * can.height;
  var xmin = corners[bbox_id_2_name[0]] * can.width;
  var bheight = (corners[bbox_id_2_name[3]] - corners[bbox_id_2_name[1]]) * can.height;
  var bwidth = (corners[bbox_id_2_name[2]] - corners[bbox_id_2_name[0]]) * can.width;
  ctx.rect(xmin, ymin, bwidth, bheight);
  ctx.stroke();
}

// module function for painting label text on canvas
function paintLabelText(i, ctx, can) {
  var probability = predictions[i]['classes'][0]['confidence'];
  var box = predictions[i]['bbox'];
  var y = box[bbox_id_2_name[1]] * can.height;
  var x = box[bbox_id_2_name[0]] * can.width;
  var bwidth = (box[bbox_id_2_name[2]] - box[bbox_id_2_name[0]]) * can.width;

  var label_name = predictions[i]['classes'][0]['category_name'];
  var label_type = predictions[i]['classes'][0]['attributes']['type'];
  var label = label_name + '-' + label_type;
  var prob_txt = (probability * 100).toFixed(1) + '%';
  var text = label + ' : ' + prob_txt;

  var tWidth = ctx.measureText(text).width;
  if (tWidth > bwidth) {
    tWidth = ctx.measureText(label).width;
    text = label;
  }
  var tHeight = parseInt(ctx.font, 10) * 1.1;

  if (label_to_id[label] === highlight) {
    ctx.fillStyle = COLOR_HIGHLIGHT;
  } else {
    ctx.fillStyle = COLOR_NORMAL;
  }
  ctx.fillRect(x - 1, y - tHeight, tWidth + 3, tHeight);
  // ctx.fillRect(x, y, tWidth + 3, tHeight);

  ctx.fillStyle = COLOR_TEXT;
  // ctx.fillText(text, x + 1, y);
  ctx.fillText(text, x - 1, y - tHeight);
}

// Take uploaded image, display to canvas and run model
function submitImageInput(event) {

  if ($('#file-input').val() !== '') {
    // Stop form from submitting normally
    event.preventDefault();

    clearCanvas();
    // Create form data
    var form = event.target;
    var file = form[0].files[0];
    var data = new FormData();
    data.append('image', file);
    data.append('threshold', 0);

    // Display image on UI
    var reader = new FileReader();
    reader.onload = function(event) {
      var file_url = event.target.result;
      var img_html = '<img id="user-image" src="' + file_url + '" />'
        + '<canvas id="image-canvas"></canvas>';
      $('#image-display').html(img_html); // replaces previous img and canvas
      predictions = []; // remove any previous metadata
      updateLabelIcons(); // reset label icons
    };
    reader.readAsDataURL(file);
    sendImage(data);
  }

}

// Send image to model endpoint
function sendImage(data) {
  $('#file-submit').text('Detecting...');
  $('#file-submit').prop('disabled', true);

  // Perform file upload
  $.ajax({
    url: 'http://0.0.0.0:8000/detection/objects',
    method: 'post',
    processData: false,
    contentType: false,
    data: data,
    dataType: 'json',
    success: function(data) {
      predictions = data['objects'];
      paintCanvas();
      if (predictions.length === 0) {
        alert('No Objects Detected');
      }
    },
    error: function(jqXHR, status, error) {
      alert('Object Detection Failed: ' + jqXHR.responseText);
      console.log(jqXHR);
    },
    complete: function() {
      $('#file-submit').text('Submit');
      $('#file-submit').prop('disabled', false);
      $('#file-input').val('');
    },
  });
}

// Run or bind functions on page load
$(function() {
  // Update canvas when window resizes
  $(window).resize(function(){
    paintCanvas();
  });

  // Image upload form submit functionality
  $('#file-upload').on('submit', submitImageInput);

  // Update threshold value functionality
  $('#threshold-range').on('input', function() {
    $('#threshold-text span').html(this.value);
    threshold = $('#threshold-range').val() / 100;
    paintCanvas();
  });

  // Populate the label icons on page load
  $.each(labels_response['labels'], function(i, label) {
    $('#label-icons').append($('<img>', {
      class: 'label-icon',
      id: 'label-icon-' + label.id,
      title: label.name,
      src: '/img/icons/' + label.id + '.png',
    }));
    label_to_id[label.name] = label.id;
  });

  // Add an "onClick" for each icon
  $('.label-icon').on('click', function() {
    var this_id = $(this).attr('id').match(/\d+$/)[0];
    if ($(this).hasClass('hide-label')) {
      $(this).removeClass('hide-label');
      filter_list.splice(filter_list.indexOf(this_id), 1);
    } else {
      $(this).addClass('hide-label');
      filter_list.push(this_id);
    }
    paintCanvas();
  });

  // Add mouse over for each icon
  $('.label-icon').hover(function() {
    highlight = $(this).attr('id').match(/\d+$/)[0];
    paintCanvas();
  }, function() {
    highlight = '';
    paintCanvas();
  });
});
