/**
 * Babylon.js Visualizer for Code Mosaic
 * Creates a stained-glass spiral visualization of code execution
 */
class CodeVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.parser = new CodeParser();
        this.buildings = [];
        this.spiralPath = null;
        this.animationSpeed = 1;
        this.isAnimating = true;
    }

    /**
     * Initialize the Babylon.js scene
     */
    init() {
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.18, 1);

        // Create camera
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 3,
            50,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 150;
        this.camera.wheelPrecision = 50;

        // Create lights
        const hemisphericLight = new BABYLON.HemisphericLight(
            "hemiLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemisphericLight.intensity = 0.6;

        const pointLight1 = new BABYLON.PointLight(
            "pointLight1",
            new BABYLON.Vector3(10, 20, 10),
            this.scene
        );
        pointLight1.intensity = 0.8;
        pointLight1.diffuse = new BABYLON.Color3(1, 0.9, 0.7);

        const pointLight2 = new BABYLON.PointLight(
            "pointLight2",
            new BABYLON.Vector3(-10, 15, -10),
            this.scene
        );
        pointLight2.intensity = 0.6;
        pointLight2.diffuse = new BABYLON.Color3(0.5, 0.7, 1);

        // Add glow layer for stained glass effect
        const glowLayer = new BABYLON.GlowLayer("glow", this.scene);
        glowLayer.intensity = 0.5;

        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        return this;
    }

    /**
     * Create a stained glass material
     */
    createStainedGlassMaterial(name, color) {
        const material = new BABYLON.StandardMaterial(name, this.scene);
        material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
        material.emissiveColor = new BABYLON.Color3(color.r * 0.3, color.g * 0.3, color.b * 0.3);
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        material.specularPower = 64;
        material.alpha = color.a;
        return material;
    }

    /**
     * Create the spiral path
     */
    createSpiralPath(steps) {
        const points = [];
        const radius = 2;
        const radiusGrowth = 0.3;
        const heightPerStep = 0.5;
        const turnsPerStep = 0.3;

        for (let i = 0; i < steps; i++) {
            const angle = i * turnsPerStep;
            const currentRadius = radius + (i * radiusGrowth);
            const x = Math.cos(angle) * currentRadius;
            const z = Math.sin(angle) * currentRadius;
            const y = i * heightPerStep;
            points.push(new BABYLON.Vector3(x, y, z));
        }

        // Create tube for the path
        const pathTube = BABYLON.MeshBuilder.CreateTube(
            "spiralPath",
            {
                path: points,
                radius: 0.2,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                updatable: false
            },
            this.scene
        );

        const pathMaterial = new BABYLON.StandardMaterial("pathMat", this.scene);
        pathMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.4);
        pathMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.35, 0.2);
        pathMaterial.alpha = 0.6;
        pathTube.material = pathMaterial;

        this.spiralPath = points;
        return points;
    }

    /**
     * Create a building/structure for a code operation
     */
    createBuilding(step, position, color, type) {
        // Vary building height based on type and depth
        const height = 1.5 + Math.random() * 2;
        const width = 0.8 + Math.random() * 0.4;

        const building = BABYLON.MeshBuilder.CreateBox(
            `building_${step}`,
            { height: height, width: width, depth: width },
            this.scene
        );

        building.position = position.clone();
        building.position.y += height / 2;

        // Create stained glass material
        const material = this.createStainedGlassMaterial(`mat_${step}`, color);
        building.material = material;

        // Add a glowing top
        const top = BABYLON.MeshBuilder.CreateBox(
            `top_${step}`,
            { height: 0.2, width: width * 1.2, depth: width * 1.2 },
            this.scene
        );
        top.position = building.position.clone();
        top.position.y += height / 2 + 0.1;
        const topMat = this.createStainedGlassMaterial(`topmat_${step}`, {
            r: color.r * 1.5,
            g: color.g * 1.5,
            b: color.b * 1.5,
            a: 0.9
        });
        top.material = topMat;

        // Animate building appearance
        building.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        BABYLON.Animation.CreateAndStartAnimation(
            `anim_${step}`,
            building,
            "scaling",
            60,
            30,
            new BABYLON.Vector3(0.01, 0.01, 0.01),
            new BABYLON.Vector3(1, 1, 1),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        top.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        BABYLON.Animation.CreateAndStartAnimation(
            `animTop_${step}`,
            top,
            "scaling",
            60,
            30,
            new BABYLON.Vector3(0.01, 0.01, 0.01),
            new BABYLON.Vector3(1, 1, 1),
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Add floating animation
        const floatAnim = new BABYLON.Animation(
            `float_${step}`,
            "position.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const keys = [
            { frame: 0, value: building.position.y },
            { frame: 60, value: building.position.y + 0.2 },
            { frame: 120, value: building.position.y }
        ];
        floatAnim.setKeys(keys);
        building.animations.push(floatAnim);
        this.scene.beginAnimation(building, 0, 120, true);

        this.buildings.push({ mesh: building, top: top, data: step });
    }

    /**
     * Visualize parsed code trace
     */
    visualize(codeTrace) {
        // Clear existing buildings
        this.buildings.forEach(b => {
            b.mesh.dispose();
            b.top.dispose();
        });
        this.buildings = [];
        
        if (this.spiralPath) {
            this.scene.getMeshByName("spiralPath")?.dispose();
        }

        // Parse the code
        const trace = this.parser.parse(codeTrace);
        
        // Create spiral path
        const pathPoints = this.createSpiralPath(trace.length);

        // Create buildings along the path
        trace.forEach((step, index) => {
            const position = pathPoints[index];
            const color = this.parser.getColorForType(step.type);
            
            setTimeout(() => {
                this.createBuilding(index, position, color, step.type);
            }, index * 100); // Stagger the creation
        });

        // Update stats
        this.updateStats(trace.length);
    }

    /**
     * Update statistics display
     */
    updateStats(count) {
        const statsElement = document.getElementById('stats');
        if (statsElement) {
            statsElement.innerHTML = `<strong>Visualizing:</strong><br>${count} execution steps`;
        }
    }

    /**
     * Reset camera to default position
     */
    resetCamera() {
        this.camera.setPosition(new BABYLON.Vector3(20, 15, 20));
        this.camera.setTarget(BABYLON.Vector3.Zero());
    }

    /**
     * Toggle animation
     */
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        if (this.isAnimating) {
            this.scene.animationsEnabled = true;
        } else {
            this.scene.animationsEnabled = false;
        }
        return this.isAnimating;
    }
}
