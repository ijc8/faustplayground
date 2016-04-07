/*				FAUSTINTERFACE.JS

	HELPER FUNCTIONS TO CREATE FAUST INTERFACES
	
	FIRST PART --> DECODE JSON ENCODED INTERFACE
	SECOND PART --> ADD GRAPHICAL OBJECTS TO INTERFACE
*/

"use strict";

/******************************************************************** 
*************************** DECODE JSON *****************************
********************************************************************/
interface Iitems extends HTMLDivElement {
    label: string;
    items: Iitems[];
    type: string;
    meta: any[];
}

interface Iitem{
    label: string;
    init: string;
    address: string;
    type: string;
    min: string;
    max: string;
    step: string;
    meta: FaustMeta[];
}
interface IFaustInterfaceControler  {
    itemParam: Iitem;
    //label: string;
    //init: string;
    //address: string;
    //type: string;
    //min: string;
    //max: string;
    //step: string;
    //meta: FaustMeta[];
    unit: string;

    precision: string;
    hasAccelerometer: boolean;
    isEnabled: boolean;
    accDefault: string;
    acc: string;
    value: string
    faustInterfaceView: FaustInterfaceView;
    accelerometerSlider: AccelerometerSlider;
}
interface FaustMeta {
    acc: string;
    noacc: string;
    unit: string;
}
class Controler implements Iitem {
    label: string;
    init: string;
    address: string;
    type: string;
    items: Iitem[];
    min: string;
    max: string;
    step: string;
    meta: FaustMeta[];
    unit: string;
    slider: HTMLInputElement;
    output: HTMLElement
    precision: string;
    hasAccelerometer: boolean;
    isEnabled: boolean;
    accDefault: string="0 0 -10 0 10";
    acc: string;
    value: string;
    accelerometerSlider: AccelerometerSlider;

}
class FaustInterfaceControler implements IFaustInterfaceControler {
    faustControlers: FaustInterfaceControler[];
    itemParam: Iitem;
    unit: string;
    precision: string;
    hasAccelerometer: boolean;
    isEnabled: boolean;
    accDefault: string = "0 0 -10 0 10";
    acc: string;
    value: string;
    accelerometerSlider: AccelerometerSlider;
    faustInterfaceView: FaustInterfaceView;




    parseFaustJsonUI(ui: Iitems[], module: ModuleClass): FaustInterfaceControler[] {
        this.faustControlers = [];
        for (var i = 0; i < ui.length; i++) {
            this.parse_group(ui[i], module);
        }
        return this.faustControlers;
    }

    parse_group(group: Iitems, module: ModuleClass): void {
        if (group.items)
            this.parse_items(group.items, module);
    }

    parse_item(item: any, module: ModuleClass): void {

        var params = module.getInterfaceParams();

        if (params && params[item.address]) {
            item.init = params[item.address];
        }

        if (item.type === "vgroup" || item.type === "hgroup" || item.type === "tgroup") {

            this.parse_items(item.items, module);

        } else if (item.type === "vslider" || item.type === "hslider") {
            var itemElement = <Iitem>item;
            var controler: FaustInterfaceControler = new FaustInterfaceControler();
            controler.itemParam = itemElement
            controler.value = itemElement.init;

            //controler.slider.addEventListener("input", (event)=> {
            //    module.interfaceCallback(event, controler)
            //    event.stopPropagation();
            //    event.preventDefault();
            //});
            //controler.slider.addEventListener("mousedown", (e) => { e.stopPropagation() })
            //controler.slider.addEventListener("touchstart", (e) => { e.stopPropagation() })
            //controler.slider.addEventListener("touchmove", (e) => { e.stopPropagation() })


            this.faustControlers.push(controler)


        } else if (item.type === "button") {
            var itemElement = <Iitem>item;
            var controler: FaustInterfaceControler = new FaustInterfaceControler();
            controler.itemParam = itemElement;
            this.faustControlers.push(controler)

        } else if (item.type === "checkbox") {
            var itemElement = <Iitem>item;
            var controler: FaustInterfaceControler = new FaustInterfaceControler();
            controler.itemParam = itemElement;
            this.faustControlers.push(controler)

        }
    }

    parse_items(items: Iitems[], node: ModuleClass): void {
        for (var i = 0; i < items.length; i++)
            this.parse_item(items[i], node);
    }


    setParams() {
        for (var j = 0; j < this.itemParam.meta.length; j++){
            if (this.itemParam.meta[j].unit) {
                this.unit = this.itemParam.meta[j].unit;
            }
        }
        if (this.unit == undefined) {
            this.unit = "";
        }

        var precision = this.itemParam.step.toString().split('.').pop().length;
        this.precision = String(precision);
    }

    createFaustInterfaceElement(): HTMLElement {
        if (this.faustInterfaceView && this.faustInterfaceView.type) {
            if (this.faustInterfaceView.type === "vslider" || this.faustInterfaceView.type === "hslider") {
                return this.faustInterfaceView.addFaustModuleSlider(this.itemParam, parseFloat(this.precision), this.unit)
            } else if (this.faustInterfaceView.type === "button") {
                return this.faustInterfaceView.addFaustButton(this.itemParam);
            } else if (this.faustInterfaceView.type === "checkbox") {
                return this.faustInterfaceView.addFaustCheckBox(this.itemParam.init);
            }
            
        }
    }
    setEventListener(callback) {
        if (this.faustInterfaceView && this.faustInterfaceView.type) {
            if (this.faustInterfaceView.type === "vslider" || this.faustInterfaceView.type === "hslider") {
                this.faustInterfaceView.slider.addEventListener("input", (event) => {
                    callback(this)
                    event.stopPropagation();
                    event.preventDefault();
                });
                this.faustInterfaceView.slider.addEventListener("mousedown", (e) => { e.stopPropagation() })
                this.faustInterfaceView.slider.addEventListener("touchstart", (e) => { e.stopPropagation() })
                this.faustInterfaceView.slider.addEventListener("touchmove", (e) => { e.stopPropagation() })
            } else if (this.faustInterfaceView.type === "button") {

            } else if (this.faustInterfaceView.type === "checkbox") {

            }
        }
    }
  

    //addFaustModuleSlider(module: ModuleClass, groupName: string, label: string, ivalue: string, imin: string, imax: string, stepUnits: string, units: string, meta: FaustMeta[], onUpdate: (event: Event, module: ModuleClass) => any): HTMLInputElement {
}

  /******************************************************************** 
    ********************* ADD GRAPHICAL ELEMENTS ************************
    ********************************************************************/
class FaustInterfaceView {
    type: string;
    slider: HTMLInputElement;
    output: HTMLElement;

    constructor(type: string) {
        this.type = type;
    }
    addFaustModuleSlider(itemParam: Iitem, precision: number, unit: string): HTMLElement {

        var group = document.createElement("div");
        group.className = "control-group";

        var info: HTMLDivElement = document.createElement("div");
        info.className = "slider-info";
        info.setAttribute("min", itemParam.min);
        info.setAttribute("max", itemParam.max);
        info.setAttribute("step", itemParam.step);
        info.setAttribute("precision", String(precision));
        var lab: HTMLSpanElement = document.createElement("span");
        lab.className = "label";
        lab.appendChild(document.createTextNode(itemParam.label));
        info.appendChild(lab);
        var val: HTMLSpanElement = document.createElement("span");
        val.className = "value";
        this.output = val;

        var myValue: string = Number(itemParam.init).toFixed(precision);
        
       
        val.appendChild(document.createTextNode("" + myValue + " " + unit));

	    // cache the units type on the element for updates
        val.setAttribute("units", unit);
	    info.appendChild(val);

	    group.appendChild(info);

        var high: number = (parseFloat(itemParam.max) - parseFloat(itemParam.min)) / parseFloat(itemParam.step);

        var slider: HTMLInputElement = document.createElement("input");
	    slider.type="range";
	    slider.min =  "0";
        slider.max = String(high);
        slider.value = String((parseFloat(itemParam.init) - parseFloat(itemParam.min)) / parseFloat(itemParam.step));
        //slider.value = String(Number(controler.init).toFixed(precision));
        slider.step = "1";
        this.slider = slider;
        group.appendChild(slider);
        //if (controler.meta != undefined) {
        //    for (var i = 0; i < controler.meta.length; i++) {
        //        if (controler.meta[i].acc) {
        //            controler.acc = controler.meta[i].acc;
        //            controler.hasAccelerometer = true;
        //            controler.isEnabled = true;
        //            controler.accelerometerSlider = AccelerometerHandler.registerAcceleratedSlider(controler, module)
        //            slider.classList.add("allowed");

        //            if (App.isAccelerometerOn) {
        //                slider.classList.remove("allowed");
        //                slider.classList.add("not-allowed");
        //                slider.disabled = true;
        //            }
        //            break;
        //        } else if (controler.meta[i].noacc) {
        //            controler.hasAccelerometer = false;
        //            controler.isEnabled = false;

        //            controler.acc = controler.meta[i].noacc;
        //            controler.accelerometerSlider = AccelerometerHandler.registerAcceleratedSlider(controler, module)
        //            break;
        //        } 
        //    }
        //    if (controler.accelerometerSlider == undefined) {
        //        controler.acc = "0 0 -10 0 10";
        //        controler.isEnabled = false;
        //        controler.hasAccelerometer = false;
        //        controler.accelerometerSlider = AccelerometerHandler.registerAcceleratedSlider(controler, module)
        //    }
        //} else {
        //    controler.acc = "0 0 -10 0 10";
        //    controler.isEnabled = false;
        //    controler.hasAccelerometer = false;
        //    controler.accelerometerSlider = AccelerometerHandler.registerAcceleratedSlider(controler, module)
        //}
	    return group;
    }

    addFaustCheckBox(ivalue: string): HTMLInputElement {
        var group = document.createElement("div");

        var checkbox: HTMLInputElement = document.createElement("input");
	    checkbox.type = "checkbox";
        checkbox.checked = false;
        //checkbox.onchange = function (event: Event) { onUpdate; event.stopPropagation() };

	    checkbox.id = "mycheckbox";

        var label: HTMLLabelElement = document.createElement('label')
	    label.htmlFor = "mycheckbox";
	    label.appendChild(document.createTextNode(" " + ivalue));
	
	    group.appendChild(checkbox);
	    group.appendChild(label);

	    return checkbox;
    }

    addFaustButton(itemParam: Iitem):HTMLElement {

        var group = document.createElement("div");

        var button: HTMLElement = document.createElement("BUTTON");        // Create a <button> element
        //button.onmouseup = function (event: Event) { onUpdate };	
        //button.onmousedown = function (event: Event) { onUpdate };	

        var labelText: Text = document.createTextNode(itemParam.label);       // Create a text node
        button.appendChild(labelText);
	                                    // Append the text to <button>
        group.appendChild(button);
	
	    return button;
    }

}
