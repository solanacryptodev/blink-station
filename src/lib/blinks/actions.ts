import 'server-only';

import { Connection, PublicKey } from '@solana/web3.js';
import { GmClientService } from '@staratlas/factory';

export const PROGRAM_ID = new PublicKey('traderDnaR5w6Tcoi3NFm53i48FTDNbGjBSZwWXDRrg');
export const CONNECTION = new Connection(process.env.HELIUS_RPC!);

export const NFT_NAME_TO_MINT: { [key: string]: string } = {
    'pearce x4': '2iMhgB4pbdKvwJHVyitpvX5z1NBNypFonUgaSAt9dtDt',
    'calico maxhog': 'GxpbUDxYYvxiUejHcAMzeV2rzdHf6KZZvT86ACrpFgXa',
};

export const gmClientService = new GmClientService();

export function isValidNftName(nftName: string): boolean {
    return !!NFT_NAME_TO_MINT[nftName.toLowerCase()];
}

export function getNftMint(nftName: string): PublicKey | null {
    const mint = NFT_NAME_TO_MINT[nftName.toLowerCase()];
    return mint ? new PublicKey(mint) : null;
}

export function validatedQueryParams(requestUrl: URL) {
    let playerPubKey = new PublicKey('5YMeDBj2C41Fr6paRWUdKc7dXua1DTbhhQwkaKuDdzty');
    let nftName: string = '';
    let label: string = '';

    try {
        if (requestUrl.searchParams.get("player")) {
            playerPubKey = new PublicKey(requestUrl.searchParams.get("player")!);
        }
    } catch (err) {
        new Error('Invalid player');
    }

    try {
        if (requestUrl.searchParams.get("nftName")) {
            nftName = requestUrl.searchParams.get("nftName") as string;
            console.log('requestURL: ', requestUrl.toJSON());
        }

        if (!isValidNftName(nftName)) {
            new Error('Invalid NFT name');
        }
    } catch (err) {
        throw "Invalid input query parameter: amount";
    }

    return {
        nftName,
        playerPubKey,
        label
    };
}
