export function sucesso(res, data, status = 200) {
  return res.status(status).json({ sucesso: true, ...data });
}

export function erro(res, mensagem, status = 400) {
  return res.status(status).json({ sucesso: false, mensagem });
}
