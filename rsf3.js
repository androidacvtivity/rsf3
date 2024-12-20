(function ($) {

    Drupal.behaviors.rsf3 = {
        attach: function (context) {

            if (!Drupal.settings.mywebform.preview) {
                var periodInfo = Drupal.settings.mywebform.period;
                $("#dec_period_from").datepicker("option", "minDate", new Date(periodInfo.start.year, periodInfo.start.month - 1, periodInfo.start.day));
                $("#dec_period_from").datepicker("option", "maxDate", new Date(periodInfo.end.year, periodInfo.end.month - 1, periodInfo.end.day));

                $("#dec_period_to").datepicker("option", "minDate", new Date(periodInfo.start.year, periodInfo.start.month - 1, periodInfo.start.day));
                $("#dec_period_to").datepicker("option", "maxDate", new Date(periodInfo.end.year, periodInfo.end.month - 1, periodInfo.end.day));

                delete_unnecessary_cfp_options();
            }

            $("#dec_period_to").on("change", function () {
                var val = $(this).val();
                var year = "";

                if (val) {
                    var periodArr = val.split(".");
                    if (periodArr.length === 3) {
                        year = periodArr[2];
                    }
                }

                $("#nalogPeriodYear").val(year).trigger("change");
            });

            jQuery('#mywebform-edit-form').on('keypress', 'input.numeric, input.float, input.money', function (event) {
                var allowNegative = jQuery(this).attr('allow-negative') || false;
                if (isNumberPressed(this, event, allowNegative) === false) {
                    event.preventDefault();
                }
            });

            jQuery('#mywebform-edit-form', context).on('paste', 'input.numeric, input.money, input.float', function (event) {
                var obj = event.originalEvent || event;

                if (typeof obj.clipboardData !== 'undefined') {
                    var value = obj.clipboardData.getData('text/plain');
                    var number = Number(value);
                    var isNotNumber = isNaN(number);

                    if (jQuery(this).hasClass('allow-negative')) {
                        if (isNotNumber) {
                            event.preventDefault();
                        }
                    } else {
                        if (isNotNumber || is_negative(number)) {
                            event.preventDefault();
                        }
                    }
                }
            });
        }
    };

    webform.beforeLoad.rsf3 = function () {
        $('#dinamicAttachments').on('mywebform:showFileInfo', '.mywebform-file-widget', function () {
            $(this).parents('div.row').find('.delrow').show();
        });

        $('#dinamicAttachments').on('mywebform:sync', '.mywebform-file-widget', function () {
            var length = Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file.length;
            if (Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file[length - 1] != '') {
                $('#dinamicAttachments .grid-addrow').trigger('click');
            }
        });
    };

    webform.afterLoad.rsf3 = function () {
        if (Drupal.settings.mywebform.preview && !Drupal.settings.mywebform.values.dec_lichidare) {
            $(".lichidare").hide();
        }
    };

    webform.validators.rsf3 = function () {
        var values = Drupal.settings.mywebform.values;
        var dateObj = new Date();
        var msg = '';

        var objFieldsTable1 = {};
        var objFieldsTable2 = {};

        for (var field in values) {
            if (field.match(/^dec_table1_row_r/)) {
                objFieldsTable1[field] = Number(values[field]);
            }

            if (field.match(/^dec_table2_row_r/)) {
                objFieldsTable2[field] = Number(values[field]);
            }
        }

        if (values.dec_fiscCod_cfoj != 997) {
            webform.errors.push({
                "fieldName": "dec_fiscCod_cfoj",
                "weight": 1,
                "msg": concatMessage('RF4-001', '', Drupal.t('Verificați CFOJ. Reprezentanțele entităților nerezidente au codul 997'))
            });
        } else if (['24', '26'].indexOf(String(values.dec_fiscCod_cfp)) === -1) {
            webform.errors.push({
                "fieldName": "dec_fiscCod_cfp",
                "weight": 19,
                "msg": concatMessage('RF4-019', '', Drupal.t('Dacă forma organizatorico-juridică este 997 – forma de proprietate este codul 24 sau 26'))
            });
        }

        var prevYear = dateObj.getFullYear() - 1;
        var currentDate = new Date();
        var validDate = new Date(prevYear, 11, 181, 23, 59, 59); // prevYear/12/31 + 150 days
        var minDate = new Date(prevYear, 0, 1).getTime();
        var maxDate = new Date(prevYear, 11, 31).getTime();
        var periodFromArr = values.dec_period_from.split(".");
        var periodToArr = values.dec_period_to.split(".");

        if (periodToArr.length == 3) {
            var periodToStr = periodToArr[2] + '-' + periodToArr[1] + '-' + periodToArr[0];
            var lastYear = new Date().getFullYear() - 1;
            var comparedDateStr = lastYear + '-12-31';
            if ((values.dec_lichidare && periodToStr >= comparedDateStr) || (!values.dec_lichidare && periodToStr != comparedDateStr)) {
                webform.errors.push({
                    'fieldName': 'dec_period_to',
                    'index': 0,
                    'weight': 5,
                    'msg': concatMessage('RF4-005', '', Drupal.t('Data sfârșitului perioadei de raportare nu este corectă')),
                });
            }
        }

        if (periodFromArr.length == 3 && periodToArr.length == 3) {
            var fromDate = new Date(periodFromArr[2], periodFromArr[1] - 1, periodFromArr[0]);
            var toDate = new Date(periodToArr[2], periodToArr[1] - 1, periodToArr[0]);

            var diffDays = Math.ceil(Math.abs(toDate.getTime() - fromDate.getTime()) / (86400000));
            var currentYear = new Date().getFullYear();
            if ((isLeap(currentYear) && diffDays > 366) || (!isLeap(currentYear) && diffDays > 365)) {
                webform.errors.push({
                    'fieldName': 'dec_period_to',
                    'index': 0,
                    'weight': 6,
                    'msg': concatMessage('RF4-006', '', Drupal.t('Perioada de raportare este mai mare de un an')),
                });
            }
        }

        if (periodFromArr.length == 3 && parseInt(periodFromArr[2]) < prevYear) {
            webform.errors.push({
                'fieldName': 'dec_period_from',
                'index': 0,
                'weight': 4,
                'msg': concatMessage('RF4-004', '', Drupal.t("Data inceputului perioadei de raportare nu este corecta")),
            });
        } else if (periodFromArr.length == 3 && periodToArr.length == 3) {
            var periodToStr = periodToArr[2] + '-' + periodToArr[1] + '-' + periodToArr[0];
            var periodFromStr = periodFromArr[2] + '-' + periodFromArr[1] + '-' + periodFromArr[0];

            if (periodFromStr > periodToStr) {
                webform.errors.push({
                    'fieldName': 'dec_period_from',
                    'index': 0,
                    'weight': 4,
                    'msg': concatMessage('RF4-004', '', Drupal.t("Data inceputului perioadei de raportare nu este corecta")),
                });
            }
        }

        if (Drupal.settings.declarations.declarations_submission_deadline_rsf3 && currentDate > validDate) {
            webform.errors.push({
                'fieldName': 'dec_period_from',
                'index': 0,
                'weight': 2,
                'msg': concatMessage('RF4-002', '', Drupal.t('Termenul prezentării Situațiilor financiare a expirat')),
            });
        }

        var filesExists = false;
        var files = Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file;
        for (var i = 0; i < files.length; i++) {
            if (files[i]) {
                filesExists = true;
                break;
            }
        }

        if (!filesExists) {
            webform.errors.push({
                'fieldName': '',
                'index': 0,
                'weight': 3,
                'msg': concatMessage('RF4-003', '', Drupal.t('Nu este atașată Nota explicativă')),
            });
        }

        if (values.dec_lichidare) {
            if (Number(values.dec_table1_row_r380c5) > 0) {
                webform.errors.push({
                    "fieldName": "dec_table1_row_r380c5",
                    "weight": 7,
                    "msg": concatMessage('RF4-007', '', Drupal.t("Situațiile financiare nu corespund bilanțului de lichidare"))
                });
            }
        }

        var filledTable1 = false;
        for (var field in objFieldsTable1) {
            if (objFieldsTable1[field]) {
                filledTable1 = true;
                break;
            }
        }

        if (!filledTable1) {
            webform.warnings.push({
                "fieldName": "",
                "weight": 8,
                "msg": concatMessage('RF4-008', '', Drupal.t('Nu este completată Anexa 1 „Bilanţul”'))
            });
        }

        msg = concatMessage('RF4-009', '', Drupal.t("Anexa 1 Valoarea trebuie sa fie pozitivă"));
        validatePositiveFields('.annex-4', msg, 9);

        if (Number(values.dec_table1_row_r140c4) < Number(values.dec_table1_row_r141c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r140c4",
                "weight": 11,
                "msg": concatMessage('RF4-011', '', Drupal.t('Anexa 1 rd.140 col.4 >= rd.141 col.4'))
            });
        }

        if (Number(values.dec_table1_row_r140c5) < Number(values.dec_table1_row_r141c5)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r140c5",
                "weight": 11,
                "msg": concatMessage('RF4-011', '', Drupal.t('Anexa 1 rd.140 col.5 >= rd.141 col.5'))
            });
        }

        if (Number(values.dec_table1_row_r190c4) != Number(values.dec_table1_row_r380c4)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r190c4",
                "weight": 16,
                "msg": concatMessage('RF4-016', '', Drupal.t('Anexa 1 rd.190 col.4 = rd.380'))
            });
        }

        if (Number(values.dec_table1_row_r190c5) != Number(values.dec_table1_row_r380c5)) {
            webform.errors.push({
                "fieldName": "dec_table1_row_r190c5",
                "weight": 16,
                "msg": concatMessage('RF4-016', '', Drupal.t('Anexa 1 rd.190 col.5 = rd.380'))
            });
        }

        var autofield_exp = [
            { 'rezField': 'dec_table1_row_r070c4', 'callback': _mywebform_expression_dec_table1_row_r070c4, 'err': '010', 'text': Drupal.t('Anexa 1 rd.070 col.4 = rd.010 + rd.020 + rd.030 + rd.040 + rd.050 + rd.060 col.4') },
            { 'rezField': 'dec_table1_row_r070c5', 'callback': _mywebform_expression_dec_table1_row_r070c5, 'err': '010', 'text': Drupal.t('Anexa 1 rd.070 col.5 = rd.010 + rd.020 + rd.030 + rd.040 + rd.050 + rd.060 col.5') },
            { 'rezField': 'dec_table1_row_r180c4', 'callback': _mywebform_expression_dec_table1_row_r180c4, 'err': '012', 'text': Drupal.t('Anexa 1 rd.180 col.4 = rd.080 + rd.090 + rd.100 + rd.110 + rd.120 + rd.130 + rd.140 + rd.150 + rd.160 + rd.170 col.4') },
            { 'rezField': 'dec_table1_row_r180c5', 'callback': _mywebform_expression_dec_table1_row_r180c5, 'err': '012', 'text': Drupal.t('Anexa 1 rd.180 col.5 = rd.080 + rd.090 + rd.100 + rd.110 + rd.120 + rd.130 + rd.140 + rd.150 + rd.160 + rd.170 col.5') },
            { 'rezField': 'dec_table1_row_r190c4', 'callback': _mywebform_expression_dec_table1_row_r190c4, 'err': '013', 'text': Drupal.t('Anexa 1 rd.190 col.4 = rd.070 + rd.180 col.4') },
            { 'rezField': 'dec_table1_row_r190c5', 'callback': _mywebform_expression_dec_table1_row_r190c5, 'err': '013', 'text': Drupal.t('Anexa 1 rd.190 col.5 = rd.070 + rd.180 col.5') },
            { 'rezField': 'dec_table1_row_r240c4', 'callback': _mywebform_expression_dec_table1_row_r240c4, 'err': '014', 'text': Drupal.t('Anexa 1 rd.240 col.4 = rd.200 + rd.210 + rd.220 + rd.230 col.4') },
            { 'rezField': 'dec_table1_row_r240c5', 'callback': _mywebform_expression_dec_table1_row_r240c5, 'err': '014', 'text': Drupal.t('Anexa 1 rd.240 col.5 = rd.200 + rd.210 + rd.220 + rd.230 col.5') },
            { 'rezField': 'dec_table1_row_r280c4', 'callback': _mywebform_expression_dec_table1_row_r280c4, 'err': '015', 'text': Drupal.t('Anexa 1 rd.280 col.4 = rd.250 + rd.260 + rd.270 col.4') },
            { 'rezField': 'dec_table1_row_r280c5', 'callback': _mywebform_expression_dec_table1_row_r280c5, 'err': '015', 'text': Drupal.t('Anexa 1 rd.280 col.5 = rd.250 + rd.260 + rd.270 col.5') },
            { 'rezField': 'dec_table1_row_r370c4', 'callback': _mywebform_expression_dec_table1_row_r370c4, 'err': '017', 'text': Drupal.t('Anexa 1 rd.370 col.4 = rd.290 + rd.300 + rd.310 + rd.320 + rd.330 + rd.340 + rd.350 + rd.360 col.4') },
            { 'rezField': 'dec_table1_row_r370c5', 'callback': _mywebform_expression_dec_table1_row_r370c5, 'err': '017', 'text': Drupal.t('Anexa 1 rd.370 col.5 = rd.290 + rd.300 + rd.310 + rd.320 + rd.330 + rd.340 + rd.350 + rd.360 col.5') },
            { 'rezField': 'dec_table1_row_r380c4', 'callback': _mywebform_expression_dec_table1_row_r380c4, 'err': '018', 'text': Drupal.t('Anexa 1 rd.380 col.4 = rd.240 + rd.280 + rd.370 col.4') },
            { 'rezField': 'dec_table1_row_r380c5', 'callback': _mywebform_expression_dec_table1_row_r380c5, 'err': '018', 'text': Drupal.t('Anexa 1 rd.380 col.5 = rd.240 + rd.280 + rd.370 col.5') },

            { 'rezField': 'dec_table2_row_r030c3', 'callback': _mywebform_expression_dec_table2_row_r030c3, 'err': '020', 'text': Drupal.t('Anexa 2 rd.030 col.3 = rd.010 - rd.020 col.3') },
            { 'rezField': 'dec_table2_row_r030c4', 'callback': _mywebform_expression_dec_table2_row_r030c4, 'err': '020', 'text': Drupal.t('Anexa 2 rd.030 col.4 = rd.010 - rd.020 col.4') },
            { 'rezField': 'dec_table2_row_r060c3', 'callback': _mywebform_expression_dec_table2_row_r060c3, 'err': '021', 'text': Drupal.t('Anexa 2 rd.060 col.3 = rd.040 - rd.050  col.3') },
            { 'rezField': 'dec_table2_row_r060c4', 'callback': _mywebform_expression_dec_table2_row_r060c4, 'err': '021', 'text': Drupal.t('Anexa 2 rd.060 col.4 = rd.040 - rd.050  col.4') },
            { 'rezField': 'dec_table2_row_r080c3', 'callback': _mywebform_expression_dec_table2_row_r080c3, 'err': '022', 'text': Drupal.t('Anexa 2 rd.080 col.3 = rd.030 + rd.060 - rd.070 col.3') },
            { 'rezField': 'dec_table2_row_r080c4', 'callback': _mywebform_expression_dec_table2_row_r080c4, 'err': '022', 'text': Drupal.t('Anexa 2 rd.080 col.4 = rd.030 + rd.060 - rd.070 col.4') },
        ];

        for (var i = 0; i < autofield_exp.length; i++) {
            validate_autofields(autofield_exp[i]);
        }

        msg = concatMessage('RF4-023', '', Drupal.t("Anexa 2 Valoarea trebuie sa fie pozitivă"));
        validatePositiveFields('.annex-4', msg, 23);

        var filledTable2 = false;
        for (var field in objFieldsTable2) {
            if (objFieldsTable2[field]) {
                filledTable2 = true;
                break;
            }
        }

        if (!filledTable2) {
            webform.warnings.push({
                "fieldName": "",
                "weight": 24,
                "msg": concatMessage('RF4-024', '', Drupal.t('Nu este completată  Anexa 2 „Situația de venituri și cheltuieli”'))
            });
        }

        if (Number(values.dec_table2_row_r080c4) != Number(values.dec_table1_row_r210c5)) {
            webform.errors.push({
                "fieldName": "dec_table2_row_r080c4",
                "weight": 25,
                "msg": concatMessage('RF4-025', '', Drupal.t('Anexa 2 rd.080 col.4 = Anexa 1 rd.210 col.5'))
            });

            webform.errors.push({
                "fieldName": "dec_table1_row_r210c5",
                "msg": ''
            });
        }

        if (!values.dec_fiscCod_street) {
            webform.warnings.push({
                "fieldName": "dec_fiscCod_street",
                "msg": Drupal.t('Câmpul nu este completat')
            });
        }

        prepare_errors('errors');
        prepare_errors('warnings');

        //Sort warnings & errors
        webform.warnings.sort(function (a, b) {
            return sort_errors_warinings(a, b);
        });

        webform.errors.sort(function (a, b) {
            return sort_errors_warinings(a, b);
        });

        webform.validatorsStatus.rsf3 = 1;
        validateWebform();
    };

    function delete_unnecessary_cfp_options() {
        var unnecessary_opt = [10, 21, 25, 27];

        for (var i = 0; i < Drupal.settings.mywebform.fields.dec_fiscCod_cfp.options.length; i++) {
            if (unnecessary_opt.indexOf(Drupal.settings.mywebform.fields.dec_fiscCod_cfp.options[i].id) !== -1) {
                Drupal.settings.mywebform.fields.dec_fiscCod_cfp.options.splice(i, 1);
                i--;
            }
        }
    }

    function sort_errors_warinings(a, b) {
        if (!a.hasOwnProperty('weight')) {
            a.weight = 9999;
        }

        if (!b.hasOwnProperty('weight')) {
            b.weight = 9999;
        }

        return toFloat(a.weight) - toFloat(b.weight);
    }

    function prepare_errors(type) {
        var dateFields = {};
        var requiredFields = {};
        var total = webform[type].length;
        var dateError = Drupal.t('Wrong field format: date needed');
        var requiredError = Drupal.t('This field is required');

        for (var i = 0; i < total; i++) {
            var error = webform[type][i];
            var fieldName = error.fieldName;
            var field = Drupal.settings.mywebform.fields.hasOwnProperty(fieldName) ? Drupal.settings.mywebform.fields[fieldName] : false;

            if (field) {
                if (field.type == 'date') {
                    if (error.msg == dateError) {
                        error.msg = '';
                        dateFields[fieldName] = field.title;
                    }
                } else if (field.type == 'period') {
                    error.msg = '';
                }

                if (field.required && error.msg == requiredError) {
                    error.msg = '';
                    requiredFields[fieldName] = field.title;
                }
            }

            if (isErrorMessageWithCode(error.msg)) {
                if (!error.hasOwnProperty('options')) {
                    error.options = {};
                }

                error.options.hide_title = true;
            }
        }

        if (Object.keys(requiredFields).length) {
            var elements = Object.values(requiredFields).join('<br />');

            webform[type].push({
                'fieldName': '',
                'weight': 10000,
                'msg': Drupal.t("<u>Cîmpuri obligatorii pentru completare:</u><br />!fields", { '!fields': elements })
            });
        }

        if (Object.keys(dateFields).length) {
            var elements = Object.values(dateFields).join('<br />');
            webform[type].push({
                'fieldName': '',
                'weight': 10001,
                'msg': Drupal.t("<u>Data trebuie să fie în formatul: ZZ.LL.AAAA, pentru:</u><br />!fields", { '!fields': elements })
            });
        }
    }

    function isErrorMessageWithCode(msg) {
        if (msg) {
            var regexp = /RF4-\d+/;
            if (regexp.test(msg)) {
                return true;
            }
        }

        return false;
    }

    function validate_autofields(item) {
        var values = Drupal.settings.mywebform.values;
        if (item.callback() != values[item.rezField]) {
            webform.errors.push({
                'fieldName': item.rezField,
                'index': 0,
                'weight': parseInt(item.err),
                'msg': concatMessage('RF4-' + item.err, '', item.text)
            });
        }
    }

    function concatMessage(errorCode, fieldTitle, msg) {
        var titleParts = [];

        if (errorCode) {
            titleParts.push(getErrorMessage(errorCode));
        }

        if (fieldTitle) {
            titleParts.push(fieldTitle);
        }

        if (titleParts.length) {
            msg = titleParts.join(', ') + ' - ' + msg;
        }

        return msg;
    }

    function getFieldTitle(field) {
        return Drupal.settings.mywebform.fields[field].title;
    }

    function getErrorMessage(errorCode) {
        return Drupal.t('Error code: @error_code', { '@error_code': errorCode });
    }

    function isLeap(year) {
        return new Date(year, 1, 29).getDate() === 29;
    }

    function validatePositiveFields(selector, msg, weight) {
        var values = Drupal.settings.mywebform.values;
        var error = false;

        jQuery(selector + ' input').each(function () {
            var fieldName = jQuery(this).attr('field');
            var allowNegative = jQuery(this).attr('allow-negative');

            if (!allowNegative && is_negative(values[fieldName])) {
                error = true;
                webform.errors.push({
                    'fieldName': fieldName,
                    'index': 0,
                    'msg': ''
                });
            }
        });

        if (error) {
            webform.errors.push({
                'fieldName': '',
                'index': 0,
                'weight': weight,
                'msg': msg
            });
        }
    }
})(jQuery);
