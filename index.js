const express = require('express')
const axios = require('axios')

const PORT=3000

const app = express()

/*2 problemes avec api.key :
    1/ la clef est visible dans le code (mauvaise pratique)
    2/ la clef est limité dans le temps (7jours avant expiration) et a besoin d'etre verifier avant d'effectuer la requete, 
    et si elle a expiré, il nous faut en générer une nouvelle et mettre a jour api.key
*/
const api = {
    base : 'https://api.insee.fr/entreprises/sirene/V3',
    key : '1a420100-da87-31b6-88f7-64b44f65e221'
}

app.use(express.json())



app.get('/api/:siren', (req, res) =>{

    let siren = req.params.siren
    let adress = ""
    let name = ""

    let nic = ""
    let siret = ""

    const authorized = api.key//req.headers.authorized

    //Premiere requete : On veut récupéré le nom de l'entreprise, et le code nic pour construire le siret pour la suite
    axios.get(`${api.base}/siren/${siren}`, {
        headers : {
            'authorization' : `Bearer ${authorized}`        
        }
    }).then(res => {
        name = res.data.uniteLegale.periodesUniteLegale[0].denominationUniteLegale
        nic = res.data.uniteLegale.periodesUniteLegale[0].nicSiegeUniteLegale
        //console.log(res.data.uniteLegale.periodesUniteLegale[0])
    }).catch(err => {
        console.log(err)
    })
    
    //Deuxieme requete : on veut maintenant récupéré l'adresse, on doit donc passer par la GET request /siret/:siret pour obtenir ces informations
    .then(() => {
        siret = siren + nic
        axios.get(`${api.base}/siret/${siret}`, {
            headers : {
                'authorization' : `Bearer ${authorized}`        
            }
        })
        .then(res => {
            let etablissement = res.data.etablissement.adresseEtablissement
            //adress : numero de voie + type de voie + nom de voie + code postal + nom de commune
            adress = `${etablissement.numeroVoieEtablissement} ${etablissement.typeVoieEtablissement} ${etablissement.libelleVoieEtablissement} ${etablissement.codePostalEtablissement} ${etablissement.libelleCommuneEtablissement}` 
            //console.log(res.data.etablissement.adresseEtablissement)
        }).catch(err => {
            console.log(err)
        })
        
        .then(() => {
                res.status(200)
            /*.send({
                'siren' : '853908358',
                'Address' : '6 RUE DES DAMES 75 017 PARIS 17',  
                'name' : 'juridifeel'
            })*/
            .send({
                'siren' : siren,
                'adress' : adress,
                'name' : name
        })
        })
    })
})

app.listen(PORT, () =>{
    console.log(`it's alive on http://localhost:${PORT}`);
})



/**
 * comment faire pour recup les informations :
 * 1/ on donne en argument le siren de l'entreprise.
 * 
 * 2/ on appel l'api : https://api.insee.fr/entreprises/sirene/V3/siren/{siren}
 *      valeur du siren est 853908358.
 * 
 * 3/ on récupère les valeur suivante de l'appel: 
 *      data.uniteLegale.siren
 *      data.uniteLegale.periodesUniteLegale[0].denominationUniteLegale -> nom (le nom doit etre en minuscule -> regex)
 *      data.uniteLegale.periodesUniteLegale[0].nicSiegeUniteLegale
 * 
 * 4/ on colle siren et nic ensemble pour recuperé le siret:
 *      siret = data.uniteLegale.siren + data.uniteLegale.periodesUniteLegale[0].nicSiegeUniteLegale
 * 
 * 5/ appel d'api : https://api.insee.fr/entreprises/sirene/V3/siret/{siret}
 *      valeur de siret : 85390835800015
 * 
 * 6/ on récupère les infos de l'adresse pour faire correspondre au format:
 *      l'adresse: 6 RUE DES DAMES 75 017 PARIS 17
 *      pour acceder au membre intéréssants : etablissement.adresseEtablissement.{data}
 *      format adress : numeroVoieEtablissement + typeVoieEtablissement + libelleVoieEtablissement + codePostalEtablissement + libelleCommuneEtablissement
 * 
 *      note : codePostalEtablissement doit s'ecrire 75 017 au lieu de 75017, donc on rajoute un espace apres le 2e caractere
 * 
 * 7/ return un objet de la forme {siren: string, adress: string, nom: string}
 * 
 * le chemin de l'api est http://localhost:3000/api/:siren -> chemin /api, GET request qui prend un ID (siren) en argument et avec en header un token. PORT=3000 (default)
 * dans headers : 
 *      rajouter Authorization et lui donner la value : Bearer 1a420100-da87-31b6-88f7-64b44f65e221
 */