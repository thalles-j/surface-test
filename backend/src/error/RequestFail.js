import ErroBase from "/ErroBase.js";

class RequestFail extends ErroBase {
  constructor(mensagem = "Um ou mais dados fornecidos estão incorretos") {
    super(mensagem, 400);
  }
}

export default RequestFail;