# Phile
Phile stands for Pentaho File access and is pronounced simply as "file". It is a stand-alone, cross-browser pure javascript module that allows you to build javascript applications that can work with the Pentaho respository. 

The main use case for Phile is Pentaho BI Server plugin applications. That said, it should be possible to use Phile from within a server-side javascript environment like node js. 

Phile ships as a single javascript resource. The unminified version, Phile.js, includes YUIDoc comments and weighs 32k. For production use, there's also a minified version available, Phile-compiled.js, which weighs 5.7k. 

You can simply include Phile with a `<script>` tag, or you can load it with a module loader, like `require()`. Phile supports the AMD module convention as well as the common js module convention. 

Phile has its YUIDoc api documentation included in the project. 

Phile is released under the terms and conditions of the Apache 2.0 software license, but I'm happy to provide you with a different license if that does not, for some reason, suit your needs. The project is on github and I'd appreciate your feedback and/or contributions there. Github is also the right place to report any issues. I will happily accept your pull requests so please feel free to contribute! 

Finally, the Phile project includes a Pentaho user console plugin. This plugin provides a sample application that demonstrates pretty much all of the available methods provided by Phile. Installing and tracing this sample application is a great way to get started with Phile.

Please [read my blog](http://rpbouman.blogspot.nl/2015/07/using-rest-services-to-work-with.html "Using REST services to work with the Pentaho BI Server repository") to learn how to get started with Phile.
