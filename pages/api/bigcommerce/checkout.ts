import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import {getConfig, BigcommerceConfig} from '@framework/bigcommerce/api'
import isAllowedMethod from '@framework/bigcommerce/api/utils/is-allowed-method'
import createApiHandler, {BigcommerceApiHandler} from '@framework/bigcommerce/api/utils/create-api-handler'
import { BigcommerceApiError } from '@framework/bigcommerce/api/utils/errors'
const METHODS = ['GET']
const fullCheckout = false
const embeddedCheckoutApi: BigcommerceApiHandler<any> = async (req, res) => {
    if (!isAllowedMethod(req, res, METHODS)) return
    const { cookies } = req
    const config = getConfig()
    const cartId = cookies.bc_cartId
    try {
        if (!cartId) {
            res.redirect('/cart')
            return
        }
        const { data } = await config.storeApiFetch(
            `/v3/carts/${cartId}/redirect_urls`,
            {
                method: 'POST',
            }
        )
        const html = `
        <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Checkout</title>
            <script src="https://checkout-sdk.bigcommerce.com/v1/loader.js"></script>
            <script>
              window.onload = function() {
                checkoutKitLoader.load('checkout-sdk').then(function (service) {
                  service.embedCheckout({
                    containerId: 'checkout',
                    url: '${data.embedded_checkout_url}'
                  });
                });
              }
            </script>
          </head>
          <body>
            <div id="checkout"></div>
          </body>
        </html>
      `
      res.status(200)
      res.setHeader('Content-Type', 'text/html')
      res.write(html)
      res.end()
    } catch (err) {
        console.error(err)
        const message =
        err instanceof BigcommerceApiError
          ? 'An unexpected error ocurred with the Bigcommerce API'
          : 'An unexpected error ocurred'
      res.status(500).json({ data: null, errors: [{ message }] })
    }
}
export default embeddedCheckoutApi
