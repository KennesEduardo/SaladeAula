import { Scene } from "phaser";
import { CONFIG } from "../config";
import Player from "../entities/Player";
import Touch from "../entities/Touch";
import Dialog from "../entities/Dialog"

export default class Lab extends Scene {
    /** @type {Phaser.Tilemaps.Tilemap} */
    map;

    /**@type {Player} */
    player;
    touch;

    /**@type {Phaser.Physics.Arcade.Group} */
    groupObjects;

    isTouching = false;

    layers = {};
    constructor() {
        super('Lab');//salvando o nome desta Cena
    }

    preload() {
        //Carregando os dados do mapa
        this.load.tilemapTiledJSON('tilemap-lab-info', 'mapas/Sala-de-Aula.json');

        //caregando os tilessets do mapa IMAGENS
        this.load.image('tiles-office', 'mapas/tiles/tiles_office.png');

        //importando um spritesheet
        this.load.spritesheet('player', 'mapas/tiles/Kennes.png', {
            frameWidth: CONFIG.TILE_SIZE,
            frameHeight: CONFIG.TILE_SIZE * 2
        });

        //Importando um Sprint lixeira
        this.load.spritesheet('lixeira1', 'mapas/tiles/lixeiras.png', {
                frameWidth: CONFIG.TILE_SIZE,
                frameHeight: CONFIG.TILE_SIZE * 2
        });
    }

    create() {
        this.createMap();
        this.createLayers();
        this.createObjects();
        this.createPlayer();
        this.createColliders();
        this.createLixeira();
        this.createCamera();

        
    }

    update() {

    }

    createPlayer() {

        this.touch = new Touch(this, 16*8, 16*5);

        this.player = new Player(this, 16*8, 16*5, this.touch) //(scene, x,y)
        this.player.setDepth (1);
        
        
    }
    createLixeira(){

        const lixeiraLaranja = this.add.sprite(233,48, 'lixeira1', 0);
        const lixeiraAzul = this.add.sprite(248,48, 'lixeira1', 3);
    }

    createMap(){
        this.map = this.make.tilemap({
            key:'tilemap-lab-info', //dados json 
            tileWidth: CONFIG.TILE_SIZE,
            tileHeight: CONFIG.TILE_SIZE
        });

        //fazendo a correnpodencia ente as imagens usada no Tiled e as carrregadas peli phaser
        // addTilesetImage(nome da imagem no Tiled, nome da imagem carregado no Phaser)
        this.map.addTilesetImage('tiles_office', 'tiles-office');
    }

    createLayers() {
        //pegando os tilessets (usar os nomes )
        const tilesOffice = this.map.getTileset('tiles_office');

        const layerNames = this.map.getTileLayerNames();
        for (let i = 0; i < layerNames.length; i++) {
            const name = layerNames[i];
            

            // this.map.createLayer(name, [tilesOffice], 0, 0);           
            this.layers[name] = this.map.createLayer(name, [tilesOffice], 0, 0);
            //definindo a profundidade de cada camada
            this.layers[name].setDepth(i);

            //verifica se o layers possui uma colisão

            if(name.endsWith('Collision') ) {
                this.layers[name].setCollisionByProperty({collide: true});
                console.log(name)

                if ( CONFIG.DEBUG_COLLISION ) {
                    const debugGraphics = this.add.graphics().setAlpha(0.75).setDepth(i);
                    this.layers[name].renderDebug(debugGraphics, {
                        tileColor: null, // Color of non-colliding tiles
                        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
                        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
                    });
                }
            }

            
        }
    }

    createObjects (){
        //crear um grupo para os objetos
        this.groupObjects = this.physics.add.group();

        // criando sprits para cada Objeto que vier da camada de objetos do Tiled
        // Parametros: nome da camda no tiles, Propriedades de seleção.
        const objects = this.map.createFromObjects("Objetos", "Objetos",{
            name: "cadeira", name:"quadro", 
            //qual imagem sera carregada no sprite (SE HOUVER)
            //key:"player"
        });

        //Tornando todos os objetos, Sprites com Physics (que possuem body)
        this.physics.world.enable(objects);

        for (let i = 0; i < objects.length; i++){
            //pegando o objeto atual
            const obj = objects[i];
            //pegando as informações do Objeto definidas no Tiled
            const prop = this.map.objects[0].objects[i];

            obj.setDepth(this.layers.length+1);
            obj.setVisible(false);

            this.groupObjects.add(obj);
            // console.log(obj)
        }

    }

    createLayersManual() {
        
        //pegando os tilesets (usar os nome dados no tile)
        const tilesOffice = this.map.getTileset('tiles_office');

        //inserido os layers manualmente
        //createLayers(nome da camada, vetor de tiles usado pra monta e posição x da cama, y da camada)
        this.map.createLayer('Base', [tilesOffice], 0, 0); //0,0 é a posição x e y
        this.map.createLayer('NivelOne', [tilesOffice], 0, 0);
        this.map.createLayer('NivelTwo', [tilesOffice], 0, 0);
        this.map.createLayer('NivelThree', [tilesOffice], 0, 0);
        
        
    }

    createCamera() {
        const mapWidth = this.map.width * CONFIG.TILE_SIZE;
        const mapHeight = this.map.height * CONFIG.TILE_SIZE;

        this.cameras.main.setBounds(0,0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player);
    }

    createColliders() {
        //diferença entre COLIDER x OVERLAP
        //COLLIDER: colide e impede a passagem
        // OVERLAP: detecta a sobreposição dos elementos, não impede a passagem
        //criando colisão entre o Player e as camadas de colisão do Tiled
        const layerNames = this.map.getTileLayerNames();
        for (let i = 0; i < layerNames.length; i++) {
            const name = layerNames[i];

            if(name.endsWith('Collision') ) {
                this.physics.add.collider(this.player, this.layers[name]);
            }
        }
        
        //criando a colisão entre a "Mãozinha"  do Player (Touch) e os objetos da camada de Objetos
        //overlap ele sobrepoem
        //chama a função this.handleTouch toda vez que o this.touch entrar em contato com um objeto do this.groupObjects
        this.physics.add.overlap(this.touch, this.groupObjects, this.handleTouch, undefined, this);
    }
    

    handleTouch(touch, objects) {
        // já realizou o primeiro toquei, sai
        if (this.isTouching && this.player.isAction) {
            return;
        }

        // Está tocando mas soltou o ESPAÇO (para de tocar)
        if (this.isTouching && !this.player.isAction) {
            this.isTouching = false;
            return;//saindo da função
        }

        //acabou de apertar o ESPAÇO pela primeira vez e ainda não iniciou o toque
        if (this.player.isAction) {
            this.isTouching = true;
            console.log("estou tocando");
            // console.log(objects);
            if(objects.name == 'cadeira'){
                if(this.player.body.enable == true){
                    this.player.body.enable = false;
                    this.player.x = objects.x - 0;
                    this.player.y = objects.y - 8;
                    this.player.direction = 'up'; //pra ficar de costa
                    this.player.setDepth(1);

                }else{
                    this.player.body.enable = true;
                    this.player.x = objects.x + 16;
                    this.player.y = objects.y - 8;
                    this.player.setDepth(0);
                    
                }
            }

            if(objects.name == 'quadro'){
                if(this.player.body.enable == true){
                    const dialogo = new Dialog (this, 150, -100, 'Na aula de hoje você se fode, kkk meme');
                }
            }
            if(objects.name == 'placaConsumo'){
                if(this.player.body.enable == true){
                    const dialogo = new Dialog (this, 150, -100, 'PROIBIDO SE ALIMENTAR');
                }
            }
            if(objects.name == 'placaEletronico'){
                if(this.player.body.enable == true){
                    const dialogo = new Dialog (this, 150, -100, 'PROIBIDO USO DE APARELHO ELETRONICO');
                }
            }
            if(objects.name == 'placaConsumo'){
                if(this.player.body.enable == true){
                    const dialogo = new Dialog (this, 150, -100, 'PROIBIDO SE ALIMENTAR');
                }
            }
            if(objects.name == 'lixeiraLaranja'){
                if(this.player.body.enable == true){
                    this.player.body.enable = false;
                    const lixeiraLaranja = this.add.sprite(233,48, 'lixeira1', 2);  
                    const dialog = new Dialog(this, 150, -100, 'Papel')                   
                }else{
                    this.player.body.enable = true;
                    const lixeiraLaranja = this.add.sprite(233,48, 'lixeira1', 0);
                    
                } 
            }

            if(objects.name == 'lixeiraAzul'){
                if(this.player.body.enable == true){
                    this.player.body.enable = false;
                    const lixeiraAzul = this.add.sprite(248,48, 'lixeira1', 5) ;
                    const dialog = new Dialog(this, 150, -100, 'papel!')
                    
                                      
                }else{
                    this.player.body.enable = true;
                    
                    const lixeiraAzul = this.add.sprite(248,48, 'lixeira1', 3)
                }
            }
        }


        
    }
}