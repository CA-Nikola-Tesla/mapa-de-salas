var table;

function table_load_async(ready_cb) {
	fetch("tabela.json?" + Math.random())
	.then(response => response.json())
	.then(data => {
		console.log("table: loaded");
		table = data;
		if (ready_cb !== undefined)
			ready_cb();
	});
}

function table_get_turmas() {
	return table["lista-turmas"];
}

function table_get_disciplina_por_sigla(sigla) {
	return table["lista-disciplinas"].find(x => x["sigla"] === sigla);
}

function table_get_horario_disciplina(turma, dia_idx, hora_idx) {
	var horario = table["horarios"].find(x => x["turma"] === turma);
	if (horario === undefined)
		return undefined;

	var dia = horario["aulas"][dia_idx];
	if (dia === undefined)
		return undefined;

	var sigla = dia[hora_idx];
	return sigla;
}

function table_get_horario_salas(turma, dia_idx, hora_idx) {
	var horario = table["horarios"].find(x => x["turma"] === turma);
	if (horario === undefined)
		return undefined;

	var dia = horario["salas"][dia_idx];
	if (dia === undefined)
		return undefined;

	var salas = dia[hora_idx];
	return salas;
}
