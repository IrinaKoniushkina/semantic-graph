bg1 = document.getElementById("bg1");
bg2 = document.getElementById("bg2");
activeBg = bg1;
hiddenBg = bg2;

svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
graphGroup = svg.append("g");
infoPanel = d3.select("#info");

currentLayout = getLayout();

fetch("http://localhost:5000/places")
    .then(res => res.json())
    .then(data => {
        console.log("GRAPH DATA:", data);
        initGraph(data);
    });

window.addEventListener("resize", () => {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
    updateSimulationLayout();
});

initLightboxEvents();