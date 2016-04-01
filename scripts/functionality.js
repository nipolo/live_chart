// version 1.1
function refresh_tables() {
    var av_interval = parseInt($("#ddlMinutesInterval option:selected").val());
    var av_interval_text = $("#ddlMinutesInterval option:selected").text();
    var all_minutes = 160;
    var needed_minutes = 120;

    $.ajax(get_data_points_url(14, all_minutes), {
        dataType: "json"
    }).done(function (data) {
        try {
            validate_input_data(data, needed_minutes);
        }
        catch (ex) {
            setTimeout(refresh_tables, 3000);
            return;
        }

        draw_with_plot_chart(data, av_interval, av_interval_text, needed_minutes);
        setTimeout(refresh_tables, 3000);
    });
}

function get_last_n_min(data, n) {
    var return_data = data.slice(data.length - n, -1);
    return_data.push(data[data.length - 1]);
    return return_data;
}

function validate_input_data(data, all_minutes) {
    if (data.length < all_minutes) {
        console.log("Data does not contain " + all_minutes + " points.")
        throw { message: "Data does not contain " + all_minutes + " points." }
    }

}

function get_data_points_url(assetid, minutes) {
    return "https://f1.osys6f.com/WCF1/WebQuotesFeedService/GetOneMinuteQuotes?assetid=" + assetid + "&minutes=" + minutes;
}

function get_av_data(data, av_interval) {
    var av_data = [];

    //adding the first point
    av_data.push([data[0][0], data[0][1]]);
    for (var i = 0; i < data.length; i += av_interval) {
        var sum_of_values = 0.0;
        var mid_index = i + ((av_interval % 2 == 0) ? av_interval / 2 : (av_interval + 1) / 2);
        for (var j = 0; j < av_interval; j++) {
            sum_of_values += data[i + j][1];
        }

        //add i-th point of average
        av_data.push([data[mid_index][0], sum_of_values / av_interval]);
    }

    //adding the last point
    av_data.push([data[data.length - 1][0], data[data.length - 1][1]]);
    return av_data;
}

function get_sma_data(data, sma_interval, all_minutes) {
    var points_for_sma_data = get_last_n_min(data, all_minutes - 1 + sma_interval);
    var sma_data = [];
    var sum_of_current_interval = 0;

    for (var i = 0; i < sma_interval; i++) {
        sum_of_current_interval += points_for_sma_data[i][1];
    }

    //put first point
    sma_data.push([points_for_sma_data[sma_interval-1][0], sum_of_current_interval / sma_interval]);

    for (var i = sma_interval; i < points_for_sma_data.length; i++) {
        sum_of_current_interval -= points_for_sma_data[i - sma_interval][1];
        sum_of_current_interval += points_for_sma_data[i][1];
        sma_data.push([points_for_sma_data[i][0], sum_of_current_interval / sma_interval]);
    } 

    return sma_data;
}

function draw_with_plot_chart(data, av_interval, av_interval_text, needed_minutes) {
    var table_data = [{
        data: get_last_n_min(data, needed_minutes),
        label: "EUR/USD exchange rate"
    }];

    if (av_interval > 0) {
        var av_data = get_av_data(table_data[0].data, av_interval);
        table_data.push({
            data: av_data,
            label: "My SMA based on interval of " + av_interval_text
        })

        var sma_data = get_sma_data(data, av_interval, needed_minutes);
        table_data.push({
            data: sma_data,
            label: "SMA based on interval of " + av_interval_text
        })
    }

    $.plot("#placeholder", table_data, {
        xaxis: {
            mode: "time"
        },
        points: {
            zoomRange: [1.0, 1.5],
            show: true
        },
        zoom: {
            interactive: true
        },
        pan: {
            interactive: true
        },
        lines: {
            show: true
        }
    });
}

function ddlMinutesInterval_change() {
    refresh_tables();
}