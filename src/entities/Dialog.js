import Phaser from "phaser";

export default class Dialog extends Phaser.GameObjects.Container{
    constructor(scene, x, y, text){
        super(scene, x, y);

        //criando balão

        this.balloon = scene.add.graphics();
        this.balloon.fillStyle(0x0000, 0.6);
        this.balloon.fillRoundedRect(-115, 190, 200, 50, 10);

        //criando o texto do balão

        this.text = scene.add.text(-10,215, text, {
            color:'#ffffff',
            fontSize: '12px',
            wordWrap:{width:100},
            align:'center',
        });

        this.text.setOrigin(0.5);
    
        //adicionando balão e o texto na cena
        this.add(this.balloon);
        this.add(this.text);

        //adicionadno o dialogo na cena
        scene.add.existing(this);

        //Adicioanndo o tempo maximo da mensagem na tela

        setTimeout(() => {
            this.setVisible(false);
            this.destroy;
        }, 2000);
    }
}