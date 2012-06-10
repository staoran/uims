package org.hello.provider;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Instantiate;
import org.apache.felix.ipojo.annotations.Provides;

import com.hello.service.Hello;

/**
 * Component implementing the Hello service.
 * 
 * @author <a href="mailto:dev@felix.apache.org">Felix Project Team</a>
 */
@Component(name = "HelloProvider")
@Provides
@Instantiate(name="HelloService")
public class HelloImpl implements Hello {

	/**
	 * Returns an 'Hello' message.
	 * 
	 * @param name
	 *            : name
	 * @return Hello message
	 * @see ipojo.example.hello.Hello#sayHello(java.lang.String)
	 */
	public String sayHello(String name) {
		return "helloiiiiii " + name;
	}
}