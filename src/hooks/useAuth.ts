import { useCallback } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { NoBscProviderError } from '@binance-chain/bsc-connector'
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector'
import {
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
  WalletConnectConnector,
} from '@web3-react/walletconnect-connector'
import { ConnectorNames, connectorLocalStorageKey } from 'widgets/WalletModal'
import { connectorsByName } from 'utils/web3React'
import { setupNetwork } from 'utils/wallet'
import { useAppDispatch } from 'state'

const useAuth = () => {
  const dispatch = useAppDispatch()
  const { activate, deactivate } = useWeb3React()

  const login = useCallback((connectorID: ConnectorNames) => {
    const connector = connectorsByName[connectorID]

    if (connector) {
      activate(connector, async (error: Error) => {
        if (error instanceof UnsupportedChainIdError) {
          const hasSetup = await setupNetwork()
          if (hasSetup) {
            activate(connector)
          }
        } else {
          window.localStorage.removeItem(connectorLocalStorageKey)
          if (error instanceof NoEthereumProviderError || error instanceof NoBscProviderError) {
            console.log('Provider Error', 'No provider was found')
          } else if (
            error instanceof UserRejectedRequestErrorInjected ||
            error instanceof UserRejectedRequestErrorWalletConnect
          ) {
            if (connector instanceof WalletConnectConnector) {
              const walletConnector = connector as WalletConnectConnector
              walletConnector.walletConnectProvider = undefined
            }
            console.log('Authorization Error', 'Please authorize to access your account')
          } else {
            console.log(error.name, error.message)
          }
        }
      })
    } else {
      console.log("Can't find connector", 'The connector config is wrong')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(() => {
    deactivate()
  }, [deactivate, dispatch])

  return { login, logout }
}

export default useAuth