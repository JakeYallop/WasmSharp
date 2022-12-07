public record AssetBehaviour
{
    private AssetBehaviour(string behaviour)
    {
        Value = behaviour;
    }

    public string Value { get; }

    public static AssetBehaviour Resource { get; } = new("resource");
    public static AssetBehaviour Assembly { get; } = new("assembly");
    public static AssetBehaviour Pdb { get; } = new("pdb");
    public static AssetBehaviour Heap { get; } = new("heap");
    public static AssetBehaviour Icu { get; } = new("icu");
    public static AssetBehaviour Vfs { get; } = new("vfs");
    public static AssetBehaviour DotnetWasm { get; } = new("dotnetwasm");
    public static AssetBehaviour JsModuleThreads { get; } = new("js-module-threads");
}
