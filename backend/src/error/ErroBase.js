class ErroBase extends Error {
    constructor(mensagem = "Erro interno do servidor", status = 500) {
        super();
        this.message = mensagem;
        this.status = status;
    }

    enviarResposta(res) {
        res.status(this.status).json({
            status: this.status,
            mensagem: this.message
        });
    }
}

export default ErroBase;
