function lojaEstaAberta(loja) {
  if (!loja.loja_aberta_manual) return false;
  if (!loja.horarios_funcionamento) return false;

  let horarios;

  try {
    horarios =
      typeof loja.horarios_funcionamento === "string"
        ? JSON.parse(loja.horarios_funcionamento)
        : loja.horarios_funcionamento;
  } catch {
    return false;
  }

  const dias = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];

  const agora = new Date();
  const diaSemana = dias[agora.getDay()];
  const hoje = horarios[diaSemana];

  if (!hoje || !hoje.ativo) return false;
  if (!hoje.abre || !hoje.fecha) return false;

  const [hA, mA] = hoje.abre.split(":").map(Number);
  const [hF, mF] = hoje.fecha.split(":").map(Number);

  const inicio = new Date(agora);
  inicio.setHours(hA, mA, 0, 0);

  const fim = new Date(agora);
  fim.setHours(hF, mF, 0, 0);

  return agora >= inicio && agora <= fim;
}

module.exports = { lojaEstaAberta };
