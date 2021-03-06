import { getAuthenticator } from './vault-custom'
import rp from 'request-promise'
import url from 'url'
import config from '../config'

const timeElapsed = time => new Date().getTime() - time

/**
 * If the user is logged into vault and the defined TTL of the vault token
 * is expired, try to renew it
 *
 * @return {function} middleware function
 */
export default function vaultTokenRenew() {
  return async (req, res, next) => {
    const vaultService = config.services.vault
    if (
      req.session.vaultTokenTTL &&
      timeElapsed(req.session.vaultTokenTTL) >= vaultService.ttl
    ) {
      try {
        await renewToken(req.session.vaultToken, vaultService)
        req.session.vaultTokenTTL = new Date().getTime()
        req.session.update()
        next()
      } catch (e) {
        next(e)
      }
    } else {
      next()
    }
  }
}

/**
 * Renew the ttl of the client token
 * @param  {String} token  Vault client token
 * @param  {String} host   Vault host
 * @param  {String} prefix Vault API prefix eg v1
 * @param  {String} ca     Certificate path
 * @return {Promise}       Request promise
 */
function renewToken(token, { host, prefix, ca }) {
  const auth = getAuthenticator(ca)
  const uri = `${url.resolve(host, prefix)}auth/token/renew`
  return rp(auth(token, { method: 'POST', uri, body: { token }, json: true }))
}
