import 'server-only';

import { Connection, PublicKey } from '@solana/web3.js';
import { GmClientService } from '@staratlas/factory';

export const PROGRAM_ID = new PublicKey('traderDnaR5w6Tcoi3NFm53i48FTDNbGjBSZwWXDRrg');
export const CONNECTION = new Connection(process.env.HELIUS_RPC!);

export const NFT_NAME_TO_MINT: { [key: string]: string } = {
    'pearce_x4': '2iMhgB4pbdKvwJHVyitpvX5z1NBNypFonUgaSAt9dtDt',
    // Add more NFTs here
};

export const gmClientService = new GmClientService();

export function isValidNftName(nftName: string): boolean {
    return !!NFT_NAME_TO_MINT[nftName.toLowerCase()];
}

export function getNftMint(nftName: string): PublicKey | null {
    const mint = NFT_NAME_TO_MINT[nftName.toLowerCase()];
    return mint ? new PublicKey(mint) : null;
}
