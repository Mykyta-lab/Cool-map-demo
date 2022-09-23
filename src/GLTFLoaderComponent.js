import { SceneComponent } from "../stuff/showcase-sdk-examples-master/packages/common/src/index";

export default class GLTFLoaderComponent extends SceneComponent
{

	onEvent(eventType, eventData)
	{
		if (type == "INTERACTION.CLICK")
		{
			this.notify(type, {
				component: this,
				x: data.input.position.x,
				y: data.input.position.y,
				data: data
			});
		}
	}

}