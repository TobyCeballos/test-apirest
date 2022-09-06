// CARTS
const express = require("express")
const { Router } = express
const contenedor = require('../controllers/contenedorProd');
const container = require('../controllers/contenedorCarts');
const carts = new Router()


carts.get('/:id', async (req, res) => {
    const id = req.params.id
    const carro = await container.getCartById(id)
    res.send(carro)
})

carts.delete('/:id', async (req, res) => {
    const id = req.params.id
    const deleteCart = await container.deleteCartByID(id)
    if(isNaN(id)) {
        res.send('El valor ingresado no es un numero')
    } else {
        res.send(deleteCart)
    }
})

carts.get('/:id/productos', async (req, res) => {
    const id = req.params.id
    const idProd = await container.getByIdProds(id)
    res.send(idProd)
})

carts.get('/:id/productos/:id_prod', async(req, res) =>{
    try{
        await container.saveProdId(req.params.id, req.params.id_prod);
        res.send(`Producto ${req.params.id_prod} agregado al carrito ${req.params.id}`)
    }
    catch(err){
        res.send(`${err} Error en el router.post-producto`)
    }
})

carts.delete('/:id/productos/:id_prod', async (req, res) => {
    const id = req.params.id
    const id_prod = req.params.id_prod
    const updCartId = await container.deleteProdById(id, id_prod)
    res.send(updCartId)
})


module.exports = carts