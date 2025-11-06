import ErroBase from "./ErroBase.js";

class ErroRole extends ErroBase {
  constructor(mensagem = "Acesso negado. Permissão insuficiente.") {
    super(mensagem, 403);
  }
}

export default ErroRole;