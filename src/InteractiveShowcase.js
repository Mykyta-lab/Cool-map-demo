export default class InteractiveShowcase
{
	static initialized = false;

	constructor()
	{
		let mp_sdk;
		let mp_model;
		let sweeps_data;
		let cur_sweep_data;
		let screens_components = [];
		let state;
		let button_pointer_texture_is_registered;

		const IDLE = "idle";
		const MOVEMENT = "movement";

		const MODELS_DATA = [
			{
				urls: [
					"/assets/content/images/panel3__group1.gltf",
					"/assets/content/images/panel3__group1__next_button.gltf",
					"/assets/content/images/panel4__group1.gltf",
					"/assets/content/images/panel4__group1__prev_button.gltf",
					"/assets/content/images/panel4__group1__next_button.gltf",
					"/assets/content/images/panel5__group1.gltf",
					"/assets/content/images/panel5__group1__prev_button.gltf",
					"/assets/content/images/panel5__group1__next_button.gltf",
					"/assets/content/images/panel6__group1.gltf",
				],
				scale: { x: 1, y: 1, z: 1 },
				pos: { x: 10, y: 1.3, z: -0.9 },
				rotation: { x: 0, y: 0, z: 0 }
			},
			{
				urls: [
					"/assets/content/images/panel12__group2.gltf",
					"/assets/content/images/panel12__group2__next_sweep_button__3386c5d15aad49daa5edf68874d3a684__0_150_0.gltf"
				],
				scale: { x: 1, y: 1, z: 1 },
				pos: { x: 10.8, y: 1.3, z: -5 },
				rotation: { x: 0, y: 0, z: 0 }
			},
			{
				urls: [
					"/assets/content/images/panel7__group3.gltf"
				],
				scale: { x: 1, y: 1, z: 1 },
				pos: { x: 8.6, y: 1, z: -11.3 },
				rotation: { x: 0, y: 0, z: 0 }
			},
			{
				urls: [
					"/assets/content/images/panel11__group4.gltf"
				],
				scale: { x: 1, y: 1, z: 1 },
				pos: { x: 15.9, y: 1.4, z: -8.9 },
				rotation: { x: 0, y: 0, z: 0 }
			},
			{
				urls: [
					"/assets/content/images/panel10__group5.gltf"
				],
				scale: { x: 1, y: 1, z: 1 },
				pos: { x: 1.05, y: 1.25, z: -20.3 },
				rotation: { x: 0, y: 0, z: 0 }
			}
		];

		InteractiveShowcase.initialized = true;

		init();

		async function init()
		{
			const mp_iframe = document.querySelector("#mp_iframe");

			mp_iframe.addEventListener("load", async () =>
			{
				try
				{
					mp_sdk = await mp_iframe.contentWindow.MP_SDK.connect(mp_iframe.contentWindow);

					await setup();
				}
				catch (error)
				{
					console.error(error);
				}
			});
		}

		async function setup()
		{
			await mp_sdk.Scene.configure((renderer, three) => {
				/*renderer.physicallyCorrectLights = true;
				renderer.gammaFactor = 2.2;
				renderer.gammaOutput = true;*/
				renderer.outputEncoding = three.sRGBEncoding;
			});

			await mp_sdk.App.state.waitUntil((state) => state.phase == mp_sdk.App.Phase.PLAYING);

			//console.log(sdk)

			mp_model = await mp_sdk.Model.getData();

			//console.log(mp_model);

			await setupModels();
		}

		async function setupModels()
		{
			const [scene_obj] = await mp_sdk.Scene.createObjects(1);

			const lights_node = scene_obj.addNode();

			lights_node.addComponent(mp_sdk.Scene.Component.AMBIENT_LIGHT, {
				intensity: 1,
				color: { r: 1, g: 1, b: 1 },
			});

			await Promise.all(MODELS_DATA.map(data =>
			{
				data.urls.forEach(url =>
				{
					return new Promise((resolve, reject) =>
					{
						const gltf_node = scene_obj.addNode();

						const gltf_component = gltf_node.addComponent(mp_sdk.Scene.Component.GLTF_LOADER, {
							url: url,
							localScale: data.scale,
							localPosition: data.pos,
							localRotation: data.rotation,
							onLoaded: () => resolve()
						});

						gltf_component.parent_node = gltf_node;
						gltf_component.uid = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("."));
						gltf_component.nav_data = gltf_component.uid.split("__");

						if (url.includes("button"))
						{
							gltf_component.is_button = true;

							if (url.includes("prev_button"))
							{
								gltf_component.is_prev_button = true;
							}
							else if (url.includes("next_button"))
							{
								gltf_component.is_next_button = true;
							}
							else if (url.includes("next_sweep_button"))
							{
								gltf_component.is_next_sweep_button = true;

								gltf_component.next_sweep_data = { uuid: gltf_component.nav_data[3], rotation: { x: 0, y: 0, z: 0 } };

								const rotation_data = gltf_component.nav_data[4].split("_");

								gltf_component.next_sweep_data.rotation.x = Number(rotation_data[0]);
								gltf_component.next_sweep_data.rotation.y = Number(rotation_data[1]);
								gltf_component.next_sweep_data.rotation.x = Number(rotation_data[2]);
							}
							gltf_component.onEvent = processButtonMouseInteraction;
						}
						gltf_component.screen_uid = gltf_component.nav_data[0];
						gltf_component.ui_screen_uid = Number(gltf_component.nav_data[0].match(/s?(\d+)\s?/)[1]);
						gltf_component.ui_group_id = Number(gltf_component.nav_data[1].match(/s?(\d+)\s?/)[1]);

						screens_components.push(gltf_component);
					});
				});
			}));

			let component;
			let screens_groups = [];

			for (let i = 0; i < screens_components.length; i++)
			{
				component = screens_components[i];

				if (!screens_groups[component.ui_group_id])
				{
					screens_groups[component.ui_group_id] = { id: 0, screens: [] };
				}
				screens_groups[component.ui_group_id].screens.push(component);

				screens_groups[component.ui_group_id].screens.sort((c1, c2) => c1.ui_screen_uid - c2.ui_screen_uid);
			}
			let screen_group;
			let component_02;

			for (let i = 0; i < screens_groups.length; i++)
			{
				screen_group = screens_groups[i];

				if (screen_group)
				{
					for (let j = 0; j < screen_group.screens.length; j++)
					{
						screen_group.screens[j].screens_group = screen_group;
					}
					for (let j = 0; j < screen_group.screens.length; j++)
					{
						component = screen_group.screens[j];

						if (!component.is_button)
						{
							for (let k = 0; k < screen_group.screens.length; k++)
							{
								component_02 = screen_group.screens[k];

								if (component_02.is_button && component_02.screen_uid == component.screen_uid)
								{
									if (!component.buttons)
									{
										component.buttons = [];
									}
									if (component_02.is_prev_button)
									{
										component.prev_button = component_02;
									}
									else if (component_02.is_next_button)
									{
										component.next_button = component_02;
									}
									component.buttons.push(component_02);

									component_02.screen = component;
								}
							}
							if (j != 0)
							{
								toggleScreenVisibility(component, false);
							}
						}
					}
					for (let j = 0; j < screen_group.screens.length; j++)
					{
						component = screen_group.screens[j];

						if (!component.is_button)
						{
							component.screen_id = j;
						}
						else
						{
							screen_group.screens.splice(j, 1);

							j--;
						}
					}
				}
				else
				{
					screens_groups.splice(i, 1);

					i--;
				}
			}
			mp_sdk.on(mp_sdk.Sweep.Event.ENTER, onSweepEnter);

			scene_obj.start();

			setTimeout(() =>
			{
				document.dispatchEvent(new CustomEvent("interactive_showcase_init"));
			}, 500);
		}

		function onSweepEnter(old_sweep_uuid, new_sweep_uuid)
		{
			if (sweeps_data)
			{
				const sweep_data = sweeps_data.find(data => data.uuid == new_sweep_uuid);

				if (sweep_data)
				{
					if (cur_sweep_data && cur_sweep_data.node && cur_sweep_data.node != sweep_data.node)
					{
						toggleButtonVisibility(cur_sweep_data.node, false);
					}
					if (sweep_data.node)
					{
						//toggleSweepNode(sweep_data.node, true);
					}
				}
				else
				{
					if (cur_sweep_data && cur_sweep_data.node)
					{
						//toggleSweepNode(cur_sweep_data.node, false);
					}
				}
				cur_sweep_data = sweep_data;
			}
		}

		function moveToSweep(sweep_data)
		{
			state = MOVEMENT;

			mp_sdk.Sweep.moveTo(sweep_data.uuid,
				{
					rotation: sweep_data.rotation,
					transition: mp_sdk.Sweep.Transition.FLY,
					transitionTime: 1000,
				})
				.then(sweep_id =>
				{
					state = IDLE;
				})
				.catch(function(error)
				{
					console.error(error);
				});

			mp_sdk.Pointer.resetTexture();
		}

		function toggleButtonVisibility(button, enable)
		{
			button.inputs.colliderEnabled = enable;

			button.inputs.visible = enable;
		}

		function toggleScreenVisibility(screen, enable)
		{
			if (screen.buttons)
			{
				for (let i = 0; i < screen.buttons.length; i++)
				{
					toggleButtonVisibility(screen.buttons[i], enable);
				}
			}
			screen.inputs.visible = enable;
		}

		async function processButtonMouseInteraction(type, data)
		{
			if (state != MOVEMENT)
			{
				this.notify(type, data);

				if (type == mp_sdk.Scene.InteractionType.HOVER)
				{
					this.use_custom_cursor = !this.use_custom_cursor;

					if (this.use_custom_cursor)
					{
						if (!button_pointer_texture_is_registered)
						{
							await mp_sdk.Pointer.registerTexture("screen_button_pointer_texture", "/assets/images/screen_button_pointer_texture.png");

							button_pointer_texture_is_registered = true;
						}
						await mp_sdk.Pointer.editTexture("screen_button_pointer_texture");
					}
					else
					{
						await mp_sdk.Pointer.resetTexture();
					}
				}
				/*else if (type == mp_sdk.Scene.InteractionType.)
				{

				}*/
				else if (type == mp_sdk.Scene.InteractionType.CLICK)
				{
					openScreen(this);
				}
			}
		}

		function openScreen(button)
		{
			const cur_screen = button.screen;

			if (button.is_button)
			{
				if (button.is_prev_button || button.is_next_button)
				{
					toggleScreenVisibility(button.screen, false);

					if (button.is_prev_button)
					{
						if (cur_screen.screen_id > 0)
						{
							cur_screen.screens_group.id--;
						}
					}
					else if (button.is_next_button)
					{
						if (cur_screen.screen_id < cur_screen.screens_group.screens.length - 1)
						{
							cur_screen.screens_group.id++;
						}
					}
					toggleScreenVisibility(cur_screen.screens_group.screens[cur_screen.screens_group.id], true);
				}
				else if (button.is_next_sweep_button)
				{
					moveToSweep(button.next_sweep_data);
				}
			}
		}

	}

}