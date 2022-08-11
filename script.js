
var map;
var cbloco;
var table;

function el(id) {
	return document.getElementById(id);
}

function get_children_with_label(root, label_regex) {
	var ret = [];
	for (var i = 0; i < root.children.length; i++) {
		var label = root.children[i].getAttribute("inkscape:label");
		if (label !== null && label_regex.test(label))
			ret.push(root.children[i]);
	}
	return ret;				
}

function get_real_bb(el) {
	var scale = 1.0;
	var transform = el.getAttribute("transform");
	if (transform !== null) {
		var m = transform.match(/^scale\((.*)\)$/);
		if (m !== null && m.length > 0) {
			scale = parseFloat(m[1]);
		}
	}
	var bb = el.getBBox();
	var ret = {
		x: bb.x * scale,
		y: bb.y * scale,
		width: bb.width * scale,
		height: bb.height * scale,
		};
	return ret;
}

function add_text_next_to_svg_el(el, text) {
	if (text === null) {
		el.style.setProperty("display", "none");
	} else {
		var names = text.split("/");
		var theight = 1.7;
		var tot_height = theight * (names.length - 1);
		var off_start = -tot_height / 2;
		for (var i = 0; i < names.length; i++) {
			var ret = document.createElementNS("http://www.w3.org/2000/svg", "text");
			var bbox = get_real_bb(el);
			ret.setAttributeNS(null, "x", bbox.x + (bbox.width / 2));
			ret.setAttributeNS(null, "y", off_start + bbox.y + (bbox.height / 2));
			ret.setAttributeNS(null, "font-size", "0.4mm");
			ret.setAttributeNS(null, "font-family", "monospace");
			ret.innerHTML = names[i].toUpperCase();
			el.parentElement.insertBefore(ret, el.nextSibling);
			off_start += theight;
		}
	}
}

function get_andares() {
	return get_children_with_label(map, /^andar-/);
}

function get_blocos(andar) {
	return get_children_with_label(andar, /^bloco-/);
}

function get_andar(n) {
	var arr = get_children_with_label(map, new RegExp("^andar-" + n + "$"));
	if (arr.length > 0)
		return arr[0];
	else
		return null;
}

function get_bloco(andar, bl) {
	var arr = get_children_with_label(andar, new RegExp("^bloco-" + bl + "$"));
	if (arr.length > 0)
		return arr[0];
	else
		return null;
}

function get_els_by_group_label(bloco, regex) {
	var ret = [];
	var els = get_children_with_label(bloco, regex);
	if (els.length == 1) {
		var layer = els[0];
		var rects = layer.getElementsByTagName("rect");
		var paths = layer.getElementsByTagName("path");
		for (var i = 0; i < rects.length; i++)
			ret.push(rects[i]);
		for (var i = 0; i < paths.length; i++)
			ret.push(paths[i]);
	}
	return ret;
}

function get_salas(bloco) {
	return get_els_by_group_label(bloco, /^salas$/);
}

function get_sem_acesso(bloco) {
	return get_els_by_group_label(bloco, /^sem-acesso$/);
}

function get_escadas(bloco) {
	return get_els_by_group_label(bloco, /^escadas$/);
}

function get_limites(bloco) {
	var lim = get_children_with_label(bloco, /^limites$/);
	if (lim.length === 1) {
		return lim[0];
	} else {
		return null;
	}
}

function set_escada_fill(escada) {
	var label = escada.getAttribute("inkscape:label");
	var dir = label.split("-")[1];
	var to;
	switch (dir) {
		case "R":
			to = "right";
			break;
		case "L":
			to = "left";
			break;
		default:
			to = "top";
			break;
	}
	escada.style.setProperty("fill", "#cccccc");
	//escada.style.removeProperty("stroke");
	escada.style.setProperty("stroke-width", "0");
}

function get_sala(s, parent) {
	if (parent === undefined)
		parent = map;
	var all = parent.getElementsByTagName("*")
	for (var i = 0; i < all.length; i++) {
		if (all[i].getAttribute("inkscape:label") === s)
		return all[i];
	}
	return null;
}

function zoom_bloco(andar_n, bloco_l) {
	var andar = get_andar(andar_n);
	if (andar !== null) {
		var bloco = get_bloco(andar, bloco_l);
		if (bloco !== null) {
			el("zoom-bloco").innerHTML = "";
			cbloco = bloco.cloneNode(true);
			els = cbloco.children;
			for (var i = 0; i < els.length; i++)
				els[i].style.setProperty("display", "");
			cbloco.setAttribute("class", "");
			el("zoom-bloco").appendChild(cbloco);
			var bbox = get_real_bb(cbloco);
			var s1 = (150 / bbox.width);
			var s2 = (150 / bbox.height);
			var s3 = s1 < s2 ? s1 : s2;
			cbloco.setAttribute("transform",
				" scale(" + s3 + ")" +
				" translate(" + (- bbox.x) + " " + (50 - bbox.y) + ") " +
				"");
		}
	}

}

function show_sala(sala_n) {
	var sala = get_sala(sala_n);
	if (sala !== null) {
		el("nomapdiv").style.setProperty("display", "none");
		el("contentdiv").style.removeProperty("opacity");
		reset_map();
		var bloco = sala.parentElement.parentElement;
		var andar = bloco.parentElement;
		var zbloco = bloco.cloneNode(true);
		set_el_view(sala, "sala", "destacado");
		set_el_view(zbloco, "bloco", "zoom");
		el("zoom-bloco").innerHTML = "<rect x=\"0\" y=\"0\" width=\"150mm\" height=\"150mm\" style=\"fill: rgb(255, 255, 255);\"></rect>";
		el("zoom-bloco").appendChild(zbloco);
		var zsala = get_sala(sala_n, zbloco);
		set_el_view(zsala, "sala", "destacado");
		var bb = get_real_bb(zbloco);
		var cbb = get_real_bb(el("zoom-bloco"));
		var sx = cbb.width / bb.width;
		var sy = cbb.height / bb.height;
		var s = sx < sy ? sx : sy;
		s *= 0.95;
		dx = (cbb.width - bb.width * s);
		dy = (cbb.height - bb.height * s);
		zbloco.style.setProperty("transform", " translateY(" + (dy / 2) + "px) translateX(" + (dx / 2) + "px) " +
			"scale(" + s + ") translateX(-" + bb.x + "px) translateY(-" + bb.y + "px)");
		
		set_el_view(andar, "andar", "destacado");
		set_el_view(bloco, "bloco", "destacado");
		
		var bnome = zbloco.getAttribute("inkscape:label").replace("-", " ").toUpperCase();
		var anome = andar.getAttribute("inkscape:label").split(",")[1].toUpperCase();
		var sala_fname = sala_n;
		var sala_oname = get_sala_old_name(sala_n);
		if (sala_oname !== null)
			sala_fname = sala_oname + "/" + sala_n;
		el("nome-area").innerHTML = bnome + " - " + anome + " - " + sala_fname.toUpperCase();
	} else {
		el("nomapdiv").style.removeProperty("display");
		el("contentdiv").style.setProperty("opacity", "0%");
	}
}

function show_disc_info(sigla, nome, professores, salas) {
	el("materiaspan").innerText = sigla + " - " + nome;
	el("professorspan").innerText = "Prof" + (professores.length > 1 ? "s" : "") + ".: " + professores.join(", ");
	el("salaspan").innerText = "Sala" + (salas.length > 1 ? "s" : "") +  ": " + salas.join(", ").toUpperCase();
	el("infodiv").style.removeProperty("display");
}

function set_el_view(el, prefix, view) {
	if (el !== null)
		el.setAttribute("class", prefix + "-inicial " + prefix + "-" + view);
}

function set_andar_display(andar_n, view) {
	set_el_view(get_andar(andar_n), "andar", view);
}

function set_bloco_display(andar_n, bloco_l, view) {
	var andar = get_andar(andar_n);
	if (andar !== null)
		set_el_view(get_bloco(andar, bloco_l), "bloco", view);
}

function set_sala_display(sala_n, view) {
	set_el_view(get_sala(sala_n), "sala", view);
}

function load_map() {
	console.log("requesting map...")
	fetch("ifsp.svg?" + Math.random()).then(r => r.text()).then(
		t => {
			console.log("map loaded");
			var xml = new DOMParser().parseFromString(t, "image/svg+xml");
			el("mapdiv").innerHTML = "";
			el("mapdiv").appendChild(xml.documentElement);
			map = el("mapdiv").firstChild;
			map.setAttribute("width", "150mm");
			map.setAttribute("height", "50mm");
			map.setAttribute("viewBox", "40 90 120 150");
			map.setAttribute("class", "map3d");
			console.log("requesting table...");
			fetch("tabela.json?" + Math.random()).then(response => response.json()).then(data => {
				table = data;
				console.log("table loaded");
				init_table();
				init_map();
				load_cookie_turma();
				seldia_hoje();
				selhora_agora();
				evt_change_sel();
				el("selectdiv").style.removeProperty("display");
			});
		});
}

function init_system() {
	load_map();
}

function reset_map() {
	var andares = get_andares();
	for (var i = 0; i < andares.length; i++) {
		andares[i].setAttribute("class", "andar-inicial andar-normal");
		var blocos = get_blocos(andares[i]);
		for (var j = 0; j < blocos.length; j++) {
			blocos[j].setAttribute("class", "bloco-inicial");
			var salas = get_salas(blocos[j]);
			for (var k = 0; k < salas.length; k++) {
				salas[k].setAttribute("class", "sala-inicial");
			}
		}
	}
}

function init_map() {
	var all = map.getElementsByTagName("*");
	for (var i = 0; i < all.length; i++) {
		if (all[i].style !== undefined) {
			all[i].style.removeProperty("display");
			all[i].style.removeProperty("opacity");
			all[i].style.removeProperty("top");
			all[i].style.removeProperty("left");
			all[i].style.removeProperty("transform");
		}
	}
	get_children_with_label(map, /^hide$/)[0].style.setProperty("display", "none");

	var andares = get_andares();
	for (var i = 0; i < andares.length; i++) {
		andares[i].style.setProperty("--translation-y", (i * 2) + "mm");
		var blocos = get_blocos(andares[i]);
		for (var j = 0; j < blocos.length; j++) {
			var salas = get_salas(blocos[j]);
			for (var k = 0; k < salas.length; k++) {
				salas[k].style.setProperty("stroke", "#000000");
				salas[k].style.setProperty("fill", "#fefecc");
				var new_name = salas[k].getAttribute("inkscape:label");
				var old_name = get_sala_old_name(new_name);
				var full_name = new_name;
				if (old_name !== null)
					full_name = old_name + "/" + full_name;
				add_text_next_to_svg_el(salas[k], full_name);
			}
			var sem_acesso = get_sem_acesso(blocos[j]);
			for (var k = 0; k < sem_acesso.length; k++) {
				sem_acesso[k].style.setProperty("stroke", "#000000");
			}
			var escadas = get_escadas(blocos[j]);
			for (var k = 0; k < escadas.length; k++) {
				escadas[k].style.setProperty("stroke", "#000000");
				set_escada_fill(escadas[k]);
			}
			var lim = get_limites(blocos[j]);
			if (lim !== null)
				lim.style.setProperty("stroke", "#000000");
		}
		var lim = get_children_with_label(andares[i], /^limites$/);
		if (lim !== null && lim.length === 1) {
			lim[0].style.removeProperty("fill");
			lim[0].style.removeProperty("stroke");
			lim[0].style.removeProperty("stroke-width");
		}
		reset_map();
		el("loadingdiv").style.setProperty("display", "none");
	}
}

function load_sel(selname, tblname) {
	var tmpval = el(selname).value;

	el(selname).innerHTML = "";
	for (var i = 0; i < table[tblname].length; i++)
		el(selname).innerHTML += "<option value='" + i + "'>" + table[tblname][i] + "</option>"

	if (tmpval !== "")
		el(selname).value = tmpval;
}

function fill_salas_sel() {
	el("selsala").innerHTML = "";
	var salas = find_salas(el("selturma").value, el("seldia").value, el("selhora").value);
	if (salas !== null && salas.length > 0) {
		for (var i = 0; i < salas.length; i++)
			el("selsala").innerHTML += "<option value='" + i + "'>" + salas[i].toUpperCase() + "</option>";
	} else {
		el("selsala").innerHTML = "<option value='0'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</option>";
	}
}

function get_disc_info(turma_idx, dia_idx, hora_idx) {
	var turma = table["lista-turmas"][turma_idx];
	var horario = table["horarios"].find(h => h["turma"] === turma);
	if (horario === undefined || horario["aulas"][dia_idx] === undefined)
		return null;
	var disc_sigla = horario["aulas"][dia_idx][hora_idx];
	var disc_idx = table["lista-disciplinas"].findIndex(t => t["sigla"] === disc_sigla);
	var disc_info = structuredClone(table["lista-disciplinas"][disc_idx]);
	var salas = table["horarios"][turma_idx]["salas"][dia_idx][hora_idx].slice();
	for (var i = 0; i < salas.length; i++) {
		for (var j = 0; j < salas[i].length; j++) {
			var new_name = get_sala_new_name(salas[i][j]);
			if (new_name !== null)
				salas[i][j] = new_name;
		}
	}
	disc_info["salas"] = table["horarios"][turma_idx]["salas"][dia_idx][hora_idx].slice();
	if( disc_info === undefined)
		disc_info = { "sigla": disc_sigla, "nome": "N/D", "professores": [ "N/D" ], "salas": [ "N/D" ] };
	return disc_info;
}

function find_salas(turma_idx, dia_idx, hora_idx) {
	var disc_info = get_disc_info(turma_idx, dia_idx, hora_idx);
	if (disc_info === null)
		return null;
	var salas = table["horarios"][turma_idx]["salas"][dia_idx][hora_idx].slice();
	if (salas === undefined)
		salas = [];
	return salas;
}

function get_sala_old_name(new_name) {
	if (new_name === null)
		return null;

	var aliases = table["alias-salas"];
	for (var i = 0; i < aliases.length; i++) {
		if (aliases[i][0].toUpperCase() === new_name.toUpperCase())
			return aliases[i][1];
	}
	return null;
}

function get_sala_new_name(old_name) {
	if (old_name === null)
		return null;

	var aliases = table["alias-salas"];
	for (var i = 0; i < aliases.length; i++) {
		if (aliases[i][1].toUpperCase() === old_name.toUpperCase())
			return aliases[i][0];
	}
	return null;
}

function init_table() {
	var tmpval;

	load_sel("selturma", "lista-turmas");
	load_sel("seldia", "lista-dias");
	load_sel("selhora", "lista-horas");
	el("selturma").onchange = evt_change_sel;
	el("seldia").onchange = evt_change_sel;
	el("selhora").onchange = evt_change_sel;
	el("selsala").onchange = evt_change_sala;
	fill_salas_sel();

	el("selectset").removeAttribute("disabled");
}

function evt_change_sel(evt) {
	el("selectset").setAttribute("disabled", "disabled");
	fill_salas_sel();
	evt_change_sala();
	el("selectset").removeAttribute("disabled");
}

function evt_change_sala(evt) {
	save_cookie_turma();
	var disc_info = get_disc_info(el("selturma").value, el("seldia").value, el("selhora").value);
	if (disc_info !== null) {
		el("errordiv").style.setProperty("display", "none");
		el("infodiv").style.removeProperty("display");
		el("contentdiv").style.removeProperty("display");
		if (disc_info["professores"] === undefined)
			disc_info["professores"] = [ "N/D" ];
		if (disc_info["salas"] === undefined)
			disc_info["salas"] = [ "N/D" ];
		var salas = disc_info["salas"].slice();
		for (var i = 0; i < salas.length; i++) {
			var old_name = salas[i];
			var new_name = get_sala_new_name(old_name);
			if (new_name !== null)
				salas[i] += "/" + new_name;
		}
		show_disc_info(disc_info["sigla"], disc_info["nome"], disc_info["professores"], salas);
		var idx_sala = el("selsala").selectedIndex;
		if (idx_sala === undefined)
			idx_sala = 0;
		var opt_sala = el("selsala").options[idx_sala];
		var nome_sala = "N/D";
		if (opt_sala !== undefined)
			nome_sala = opt_sala.text.toLowerCase();

		var nome_novo = get_sala_new_name(nome_sala);
		if (nome_novo !== null)
			nome_sala = nome_novo;
		show_sala(nome_sala);
	} else {
		el("errordiv").style.removeProperty("display");
		el("nomapdiv").style.setProperty("display", "none");
		el("infodiv").style.setProperty("display", "none");
		el("contentdiv").style.setProperty("display", "none");
	}
}

/* https://www.w3schools.com/js/js_cookies.asp */
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return null;
}

function save_cookie_turma() {
	setCookie("selturma", el("selturma").value, 182);
}

function load_cookie_turma() {
	var tidx = getCookie("selturma");
	if (tidx !== null) {
		el("selturma").value = tidx;
		evt_change_sel();
	}
}

function seldia_hoje() {
	var now = new Date();
	var idx = now.getDay() - 1;
	if ((now.getHours() == 22 && now.getMinutes() > 50) || now.getHours() > 22)
		idx++;
	if (idx >= 0 && idx <= 4) {
		el("seldia").selectedIndex = idx;
	}
}

function selhora_agora() {
	var hora = new Date().getHours();
	var minuto = new Date().getMinutes();
	var htbl = [];
	var now = new Date();
	var prefix = now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate() + " ";
	var sel_idx = -1;
	for (var i = 0; i < table["lista-horas"].length; i++) {
		var t = table["lista-horas"][i].split("-");
		var t1 = t[0].trim();
		var t2 = t[1].trim();
		htbl.push([ new Date(prefix + t1), new Date(prefix + t2) ]);
	}
	if (now >= htbl[htbl.length - 1]) {
		sel_idx = table["lista-horas"].length - 1;
	} else {
		for(var i = 0; i < htbl.length; i++) {
			if (now < htbl[i][1]) {
				sel_idx = i;
				break;
			}
		}
	}
	if (sel_idx < 0)
		sel_idx = htbl.length - 1;
	el("selhora").selectedIndex = sel_idx;
}