import * as d3scale from "d3-scale";
import {format as d3format} from "d3-format";

export const drawLegend = (layer, newCanvas, mbCanvas) => {
    const context = newCanvas.getContext("2d")
    context.drawImage(mbCanvas, 0, 0);

    let x = mbCanvas.width - 20 - 360,
        y = 20;
    context.fillStyle = 'white'
    context.roundRect(x, y, 370, 50, 5);
    context.fill();
    // context.fillRect(x, y, 370, 50);

    context.fillStyle = '#232323'
    const text = layer.legend.Title({layer});
    context.fillText(text, x + 10, y, 320);

    x += 10
    y += 10

    const w = 350 / layer.legend.range.length;
    layer.legend.range.forEach((c, i) => {
        context.fillStyle = c;
        context.fillRect(x + i * w, y, w, 20);
    })

    let scale;

    // eslint-disable-next-line default-case
    switch (layer.legend.type) {
        case "quantile":
            scale = d3scale.scaleQuantile()
                .domain(layer.legend.domain)
                .range(layer.legend.range);
            break;
        case "quantize":
            scale = d3scale.scaleQuantize()
                .domain(layer.legend.domain)
                .range(layer.legend.range);
            break;
        case "threshold":
            scale = d3scale.scaleThreshold()
                .domain(layer.legend.domain)
                .range(layer.legend.range);
            break;
    }

    const format = (typeof layer.legend.format === "function") ?
        layer.legend.format :
        d3format(layer.legend.format);

    x += 3;
    y += 33;
    context.fillStyle = '#232323'
    context.font = "11px Arial";
    context.textAlign = "right";
    layer.legend.range.forEach((c, i) => {
        const text = format(scale?.invertExtent(c)[1]);
        context.fillText(text, x + w + i * w, y);
    })
    return 0;
}