
$(function(){
    var accuweatherAPIKey = "Wj39Tl2fFmOAixtrlcRbMQCseG4OU4yc";

    var weatherObject = {
        cidade: "",
        estado: "",
        pais: "",
        temperatura: "",
        texto_clima: "",
        icone_clima: ""
    }

    function preencherClimaAgora(cidade, estado, pais, temperatura, texto_clima, icone_clima){

        var texto_local = cidade + ", " + estado + ". " + pais;
        $("#texto_local").text(texto_local);
        $("#texto_clima").text(texto_clima);
        $("#texto_temperatura").html(String(temperatura) + "&deg;");
        $("#icone_clima").css("background-image", "url('" + icone_clima + "')" );

    }

    function gerarGrafico(horarios, temperaturas){
        Highcharts.chart('hourly_chart', {
            chart: {
              type: 'spline'
            },
            title: {
              text: 'Temperatura hora a hora'
            },
            xAxis: {
              categories: horarios,
              accessibility: {
                description: 'Temperatura (°C)'
              }
            },
            yAxis: {
              title: {
                text: 'Temperatura'
              },
              labels: {
                formatter: function () {
                  return this.value + '°';
                }
              }
            },
            tooltip: {
              crosshairs: true,
              shared: true
            },
            plotOptions: {
              spline: {
                marker: {
                  radius: 4,
                  lineColor: '#666666',
                  lineWidth: 1
                }
              }
            },
            series: [{     
              showInLegend: false,        
              data: temperaturas
          
            }]
          });         

    }

    function pegarPrevisaoHoraAHora(localCode){
        $.ajax({
            url: "https://dataservice.accuweather.com/forecasts/v1/hourly/12hour/"+ localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function(data){
                var horarios = [];
                var temperaturas = [];
                
                for (var a = 0; a < 12; a++){
                    var hora = new Date( data[a].DateTime ).getHours();

                    horarios.push( String(hora) + "h");
                    temperaturas.push( data[a].Temperature.Value);

                    gerarGrafico(horarios, temperaturas);
                    $('.refresh-loader').fadeOut();
                }
                
            },
            error: function(){
                gerarErro("Erro ao obter previsãohora a hora");
            }
    
        });
    }

    function pegarPrevisao5Dias(localCode){
        
        $.ajax({
            url: "https://dataservice.accuweather.com/forecasts/v1/daily/5day/"+ localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function(data){
                $("#texto_max_min").html( String(data.DailyForecasts[0].Temperature.Minimum.Value) + "&deg; / " + String(data.DailyForecasts[0].Temperature.Maximum.Value) + "&deg;" );
                preencherPrevisao5Dias(data.DailyForecasts);
            },
            error: function(){
                gerarErro("Erro ao obter previsão de 5 dias");
            }   
        });
    }

    function preencherPrevisao5Dias(previsoes){
        $("#info_5dias").html("");

        var diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

        for (var a = 0; a < 5; a++){

            var dataHoje = new Date(previsoes[a].Date);
            var dia_semana = diasSemana[dataHoje.getDay()];      
            var elementoHTMLDia = "";          
            var iconNumber = previsoes[a].Day.Icon <= 9 ? "0" + String(previsoes[a].Day.Icon) : String(previsoes[a].Day.Icon);

            iconeClima = "https://developer.accuweather.com/sites/default/files/" + iconNumber + "-s.png";
            maxima = String(previsoes[a].Temperature.Maximum.Value);
            minima = String(previsoes[a].Temperature.Minimum.Value);

            elementoHTMLDia =  '<div class="day col">';            
            elementoHTMLDia += ' <div class="day_inner">';           
            elementoHTMLDia +=      '<div class="dayname">';            
            elementoHTMLDia +=          dia_semana;           
            elementoHTMLDia +=      '</div>';           
            elementoHTMLDia +=      '<div style="background-image: url(\'' + iconeClima + '\')" class="daily_weather_icon"></div>';
            elementoHTMLDia +=      '<div class="max_min_temp">';            
            elementoHTMLDia +=          '' + minima + '&deg; / ' + maxima + '&deg;';
            elementoHTMLDia +=      '</div>';           
            elementoHTMLDia +=   '</div>';           
            elementoHTMLDia += '</div>';
            
            $("#info_5dias").append(elementoHTMLDia);
            elementoHTMLDia = "";           
        }

    }

    function pegarTempoAtual(localCode){
        $.ajax({
            url: "https://dataservice.accuweather.com/currentconditions/v1/"+ localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function(data){

                weatherObject.temperatura = data[0].Temperature.Metric.Value;
                weatherObject.texto_clima = data[0].WeatherText;

                var iconNumber = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : String(data[0].WeatherIcon);

                weatherObject.icone_clima = "https://developer.accuweather.com/sites/default/files/" + iconNumber +"-s.png";

                preencherClimaAgora(weatherObject.cidade, weatherObject.estado, weatherObject.pais, weatherObject.temperatura, weatherObject.texto_clima, weatherObject.icone_clima);
            },
            error: function(){
                gerarErro("Erro ao obter clima atual");
            }
    
        });
    }

    function pegarLocalUsuario(lat, long){
        $.ajax({
            url: "https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=" + accuweatherAPIKey + "&q=" + lat + "%2C" + long + "&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function(data){

                try {
                    weatherObject.cidade = data.ParentCity.LocalizedName;
                }
                catch {
                    weatherObject.cidade = data.LocalizedName;
                }

                weatherObject.estado = data.AdministrativeArea.LocalizedName;
                weatherObject.pais = data.Country.LocalizedName;

                var localCode = data.Key;
                pegarTempoAtual(localCode);
                pegarPrevisao5Dias(localCode);
                pegarPrevisaoHoraAHora(localCode);
            },
            error: function(){
                gerarErro("Erro ao pegar local do usuário");
            }
    
        });
    }

    function pegarCoordenadasDoIp(){
        var lat_padrao =-23.5681;
        var long_padrao =-46.6492;

        $.ajax({
            url: "http://www.geoplugin.net/json.gp",
            type: "GET",
            dataType: "json",
            success: function(data){
                              
                if (data.geoplugin_latitude && data.geoplugin_longitude){
                    pegarLocalUsuario(data.geoplugin_latitude, data.geoplugin_longitude);
                } else {
                    pegarLocalUsuario(lat_padrao, long_padrao);
                }
                
            },
            error: function(){
                pegarLocalUsuario(lat_padrao, long_padrao);
            }
    
        });
    }

    function pegarCoordenadasDaPesquisa(input){
        input = encodeURI(input);
        
        $.ajax({
            url: "https://nominatim.openstreetmap.org/search?q=" + input + "&format=geojson",
            type: "GET",
            dataType: "json",
            success: function(data){    
               try{
                var long = data.features[0].geometry.coordinates[0];
                var lat  = data.features[0].geometry.coordinates[1];
                pegarLocalUsuario(lat, long); 
               } catch{
                gerarErro("Erro na pesquisa de local");
               }                                     
                             
            },
            error: function(){
                gerarErro("Erro na pesquisa de local");
            }
    
        });
        
    }

    function gerarErro(mensagem){

        if(!mensagem){
            mensagem = "Erro na solicitação";
        }

        $('.refresh-loader').hide();
        $("#aviso-erro").text(mensagem);
        $("#aviso-erro").slideDown();
        window.setTimeout(function(){
            $("#aviso-erro").slideUp();
        }, 4000);

    }
    
    pegarCoordenadasDoIp();

    $("#search-button").click(function(){       
        var nomeLocal = $("#local").val().trim();
        nomeLocal = nomeLocal.replace(/ /g, "-");
        if (nomeLocal){
            $('.refresh-loader').show();
            pegarCoordenadasDaPesquisa(nomeLocal);
        } else {
            alert('Local inválido');
        }
    });

    $("#local").on('keypress', function(e){        
        if(e.which == 13){
            var nomeLocal = $("#local").val().trim();
            nomeLocal = nomeLocal.replace(/ /g, "-");
            if (nomeLocal){
                $('.refresh-loader').show();
                pegarCoordenadasDaPesquisa(nomeLocal);
            } else {
                alert('Local inválido');
            }
        }       
    });
    
    

});